import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/returns
 * Supports query params: status, reason, dateFrom, dateTo, search
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const reason = url.searchParams.get('reason');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (reason && reason !== 'all') {
      where.reason = { contains: reason, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.requestedAt = {};
      if (dateFrom) where.requestedAt.gte = new Date(dateFrom);
      if (dateTo) where.requestedAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (search) {
      where.OR = [
        { order: { shopifyOrderId: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { product: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const returns = await prisma.return.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        order: true,
        customer: true,
        product: true,
      },
    });

    // Also fetch summary counts
    const [requested, approved, received, refunded, rejected] = await Promise.all([
      prisma.return.count({ where: { status: 'REQUESTED' } }),
      prisma.return.count({ where: { status: 'APPROVED' } }),
      prisma.return.count({ where: { status: 'RECEIVED' } }),
      prisma.return.count({ where: { status: 'REFUNDED' } }),
      prisma.return.count({ where: { status: 'REJECTED' } }),
    ]);

    return NextResponse.json({
      returns,
      summary: { requested, approved, received, refunded, rejected, total: returns.length },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Returns API Error:', error.message);
    return NextResponse.json({ returns: [], summary: { requested: 0, approved: 0, received: 0, refunded: 0, rejected: 0, total: 0 } }, { status: 200 });
  }
}

/**
 * POST /api/admin/returns/bulk
 * Bulk approve or reject returns
 */
export async function POST(req: NextRequest) {
  try {
    const { action, ids } = await req.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No return IDs provided.' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const result = await prisma.return.updateMany({
      where: {
        id: { in: ids },
        status: 'REQUESTED', // Only bulk-update items that are still in REQUESTED state
      },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} return(s) ${action === 'approve' ? 'approved' : 'rejected'}.`,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Bulk Returns Error:', error.message);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
