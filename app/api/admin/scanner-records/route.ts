import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get('actionType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (actionType && actionType !== 'ALL') {
      where.actionType = actionType;
    }
    if (search) {
      where.OR = [
        { productTitle: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { staffName: { contains: search } },
      ];
    }

    const [records, total] = await Promise.all([
      (prisma as any).scanRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).scanRecord.count({ where }),
    ]);

    return NextResponse.json({ records, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Scan Records API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch scan records' }, { status: 500 });
  }
}
