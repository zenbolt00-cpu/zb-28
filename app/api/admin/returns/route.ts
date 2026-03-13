import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const returns = await prisma.return.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        order: true,
        customer: true,
        product: true,
      },
    });

    return NextResponse.json({ returns }, { status: 200 });
  } catch (error: any) {
    console.error('Returns API Error:', error.message);
    return NextResponse.json({ returns: [] }, { status: 200 });
  }
}
