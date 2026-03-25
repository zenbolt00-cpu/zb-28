import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// In-memory rate limiting store
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const entry = loginAttempts.get(ip);
  if (!entry) return { allowed: true };

  if (entry.lockedUntil > Date.now()) {
    const retryAfter = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return { allowed: false, retryAfter };
  }

  // Reset if lockout expired
  if (entry.lockedUntil <= Date.now() && entry.count >= MAX_ATTEMPTS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  loginAttempts.set(ip, entry);
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Generate a stable session token from password using HMAC
function makeSessionToken(password: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'zica-bella-admin-secret-key-2026';
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    
    // Check rate limit
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${rateCheck.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();
    const cleanUsername = username?.trim().toLowerCase();
    const cleanPassword = password?.trim();
    
    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json({ error: 'Identity and Key required' }, { status: 400 });
    }

    // Input validation
    if (cleanUsername.length > 50 || cleanPassword.length > 128) {
      return NextResponse.json({ error: 'Invalid input length' }, { status: 400 });
    }

    // Fetch admin from database
    const admin = await prisma.admin.findUnique({
      where: { username: cleanUsername }
    });

    if (!admin) {
      recordFailedAttempt(ip);
      // Timing-safe: always delay to prevent user enumeration
      await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check password: support both bcrypt hashed and plain-text (legacy) passwords
    let passwordValid = false;
    const storedPassword = admin.password.trim();
    
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
      // Password is already bcrypt-hashed
      passwordValid = await bcrypt.compare(cleanPassword, storedPassword);
    } else {
      // Legacy plain-text password — compare and auto-upgrade to bcrypt
      passwordValid = cleanPassword === storedPassword;
      
      if (passwordValid) {
        // Auto-upgrade: hash the password and save it
        const hashedPassword = await bcrypt.hash(cleanPassword, 12);
        await prisma.admin.update({
          where: { id: admin.id },
          data: { password: hashedPassword }
        });
      }
    }

    if (!passwordValid) {
      recordFailedAttempt(ip);
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login — clear rate limiter
    clearAttempts(ip);

    // Use the static ADMIN_SESSION_TOKEN for consistency with the Edge middleware
    const sessionToken = process.env.ADMIN_SESSION_TOKEN;
    
    if (!sessionToken) {
      console.error('❌ CRITICAL: ADMIN_SESSION_TOKEN is not set in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    cookieStore.set('admin_username', cleanUsername, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    console.log(`✅ Admin login successful for: ${cleanUsername}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
