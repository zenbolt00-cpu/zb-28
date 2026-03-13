import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const exchanges = await prisma.exchange.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        originalProduct: true,
        newProduct: true,
      },
    });

    return NextResponse.json({ exchanges }, { status: 200 });
  } catch (error: any) {
    console.error('Exchanges API Error:', error.message);
    return NextResponse.json({ exchanges: [] }, { status: 200 });
  }
}
