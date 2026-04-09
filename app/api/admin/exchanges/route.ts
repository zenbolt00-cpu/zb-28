import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/exchanges
 * Supports query params: status, search
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { order: { shopifyOrderId: { contains: search, mode: 'insensitive' } } },
        { originalProduct: { title: { contains: search, mode: 'insensitive' } } },
        { newProduct: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const exchanges = await prisma.exchange.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { include: { customer: true } },
        originalProduct: true,
        newProduct: true,
      },
    });

    // Summary counts
    const [requested, approved, shipped, delivered, rejected] = await Promise.all([
      prisma.exchange.count({ where: { status: 'REQUESTED' } }),
      prisma.exchange.count({ where: { status: 'APPROVED' } }),
      prisma.exchange.count({ where: { status: 'SHIPPED' } }),
      prisma.exchange.count({ where: { status: 'DELIVERED' } }),
      prisma.exchange.count({ where: { status: 'REJECTED' } }),
    ]);

    return NextResponse.json({
      exchanges,
      summary: { requested, approved, shipped, delivered, rejected, total: exchanges.length },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Exchanges API Error:', error.message);
    return NextResponse.json({ exchanges: [], summary: { requested: 0, approved: 0, shipped: 0, delivered: 0, rejected: 0, total: 0 } }, { status: 200 });
  }
}
