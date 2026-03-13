import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId');
    const shopDomain = url.searchParams.get('shopDomain');

    if (!customerId || !shopDomain) {
      return NextResponse.json({ error: 'Missing customerId or shopDomain' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { 
        customerId: customerId,
        shopId: shop.id
      },
      include: {
        items: true,
        returns: true,
        exchanges: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error('Portal Orders API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
