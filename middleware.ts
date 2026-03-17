import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Must match the HMAC function in the login API
function makeSessionToken(password: string): string {
  // We inline a simple HMAC here since we cannot import Node crypto in Edge Runtime
  // Instead we use a deterministic token stored in env
  // The cookie value == sha256_hmac(NEXTAUTH_SECRET, adminPassword)
  // Since we can't run crypto in edge, we compare against ADMIN_SESSION_TOKEN set at startup
  return process.env.ADMIN_SESSION_TOKEN || 'not-configured';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for the login page itself to avoid redirect loop
  if (pathname === '/dashboard/login') return NextResponse.next();
  if (pathname === '/api/admin/login') return NextResponse.next();

  // Paths to protect — dashboard pages and admin API
  const isAdminPath = pathname.startsWith('/dashboard');
  const isAdminApi  = pathname.startsWith('/api/admin');

  if (isAdminPath || isAdminApi) {
    const sessionToken = request.cookies.get('admin_session')?.value;
    const validToken   = process.env.ADMIN_SESSION_TOKEN;

    // Production: no debug logging for security

    // MANDATORY AUTH: Fail if session token is missing or incorrect
    if (!validToken || sessionToken !== validToken) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/dashboard/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
  ],
};
