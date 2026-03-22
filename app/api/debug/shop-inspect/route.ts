import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shop = await prisma.shop.findFirst({
      include: {
        _count: {
          select: {
            products: true,
            customers: true,
            orders: true
          }
        }
      }
    });

    return NextResponse.json({
      status: 'success',
      shop: shop ? {
        id: shop.id,
        domain: shop.domain,
        accessToken: shop.accessToken ? 'PRESENT' : 'MISSING',
        _count: shop._count
      } : 'No shop found'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
