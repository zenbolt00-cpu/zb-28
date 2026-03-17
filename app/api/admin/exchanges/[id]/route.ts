import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json(); // expected: 'approved', 'rejected', 'payment_pending', 'shipped'
    const exchangeId = params.id;

    if (!status || !['approved', 'rejected', 'payment_pending', 'shipped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 });
    }

    const exchangeRequest = await prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: { order: { include: { shop: true } } }
    });

    if (!exchangeRequest) {
      return NextResponse.json({ error: 'Exchange request not found' }, { status: 404 });
    }

    const updatedExchange = await prisma.exchange.update({
      where: { id: exchangeId },
      data: { status }
    });

    // If approved and price difference > 0, generate a Draft Order / Invoice on Shopify
    if (status === 'approved' && updatedExchange.priceDifference > 0) {
      console.log(`Mock: Generating Draft Order for price difference of ${updatedExchange.priceDifference} for order ${exchangeRequest.order.shopifyOrderId}`);
      // Then set status to 'payment_pending'
      await prisma.exchange.update({
        where: { id: exchangeId },
        data: { status: 'payment_pending' }
      });
    }

    return NextResponse.json({ success: true, exchange: updatedExchange }, { status: 200 });
  } catch (error) {
    console.error('Admin Exchange API Error:', error);
    return NextResponse.json({ error: 'Failed to update exchange request' }, { status: 500 });
  }
}
