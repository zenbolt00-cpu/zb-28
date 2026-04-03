import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

interface ReturnItem {
  lineItemId: string;
  quantity: number;
  reason: string;
  action: 'return' | 'exchange';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, items, notes } = body as {
      orderId: string;
      items: ReturnItem[];
      notes?: string;
    };

    if (!orderId || !items?.length) {
      return NextResponse.json(
        { success: false, error: 'orderId and items[] are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        shipments: { orderBy: { createdAt: 'desc' as const }, take: 1 },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const deliveredDate = order.deliveryStatus === 'delivered' ? order.updatedAt : null;
    if (deliveredDate) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDelivery > 7) {
        return NextResponse.json(
          { success: false, error: 'Return/exchange window has expired (7 days from delivery)' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const createdReturns: any[] = [];
    const createdExchanges: any[] = [];

    for (const item of items) {
      const orderItem = order.items.find(
        (oi: any) => oi.id === item.lineItemId || oi.shopifyLineItemId === item.lineItemId
      );

      if (!orderItem) continue;

      if (item.action === 'return') {
        const returnRecord = await prisma.return.create({
          data: {
            orderId: order.id,
            productId: orderItem.productId || '',
            customerId: order.customerId,
            sku: orderItem.sku,
            reason: item.reason || notes || 'Customer requested return via app',
            status: 'REQUESTED',
          },
        });
        createdReturns.push(returnRecord);
      } else if (item.action === 'exchange') {
        if (!orderItem.productId) continue;
        const exchangeRecord = await prisma.exchange.create({
          data: {
            orderId: order.id,
            originalProductId: orderItem.productId,
            newProductId: orderItem.productId,
            status: 'REQUESTED',
            priceDifference: 0,
          },
        });
        createdExchanges.push(exchangeRecord);
      }
    }

    const totalCreated = createdReturns.length + createdExchanges.length;
    if (totalCreated === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid items found for return/exchange' },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${totalCreated} request(s) submitted successfully`,
        returns: createdReturns.map((r: any) => ({ id: r.id, status: r.status })),
        exchanges: createdExchanges.map((e: any) => ({ id: e.id, status: e.status })),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[App API] Return/Exchange error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
