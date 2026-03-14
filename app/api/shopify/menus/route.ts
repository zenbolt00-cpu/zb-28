import { NextResponse } from 'next/server';
import { fetchMenus } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const shop = await prisma.shop.findFirst();
    if (!shop?.accessToken) {
      return NextResponse.json({ error: 'Shop not configured' }, { status: 400 });
    }

    const menus = await fetchMenus();
    return NextResponse.json({ menus });
  } catch (error) {
    console.error('Error fetching Shopify menus:', error);
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 });
  }
}
