import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

function safeJsonParse(input: string | null): any | null {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get('phone')?.trim();
    const email = url.searchParams.get('email')?.trim();

    if (!phone && !email) {
      return NextResponse.json(
        { addresses: [], error: 'phone or email query parameter required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const where: any = { OR: [] };
    if (phone) where.OR.push({ phone });
    if (email) where.OR.push({ email });

    const customer = await prisma.customer.findFirst({
      where,
      select: { defaultAddress: true, name: true, email: true, phone: true },
    });

    const addr = safeJsonParse(customer?.defaultAddress || null);
    if (!addr) {
      return NextResponse.json({ addresses: [] }, { headers: corsHeaders });
    }

    // Normalize to the shape expected by the app Checkout screen.
    const normalized = {
      name: addr.name || customer?.name || '',
      phone: addr.phone || customer?.phone || '',
      email: addr.email || customer?.email || '',
      address1: addr.address1 || addr.street || '',
      address2: addr.address2 || '',
      city: addr.city || '',
      state: addr.province || addr.state || '',
      zip: addr.zip || addr.pincode || '',
      country: addr.country || 'India',
    };

    return NextResponse.json({ addresses: [normalized] }, { headers: corsHeaders });
  } catch (e: any) {
    console.error('[App API] Customer addresses error:', e.message);
    return NextResponse.json(
      { addresses: [], error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

