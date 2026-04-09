import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/exchanges/[id]
 * Update exchange status with full workflow:
 *   REQUESTED → APPROVED → SHIPPED → DELIVERED
 *   REQUESTED → REJECTED
 * On APPROVED with a new order: auto-create the exchange shipment order
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, trackingNumber, newOrderId } = body;
    const exchangeId = params.id;

    const validStatuses = ['APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const exchangeRequest = await prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        order: { include: { shop: true, customer: true, items: true } },
        originalProduct: true,
        newProduct: true,
      },
    });

    if (!exchangeRequest) {
      return NextResponse.json({ error: 'Exchange request not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = { status };

    // When approved, handle payment status and auto-create new order
    if (status === 'APPROVED') {
      if (exchangeRequest.priceDifference > 0) {
        updateData.paymentStatus = 'PENDING';
      } else {
        updateData.paymentStatus = 'COMPLETED';
      }

      // Auto-create a new exchange order in the database
      try {
        const newOrder = await prisma.order.create({
          data: {
            shopId: exchangeRequest.order.shopId,
            shopifyOrderId: `EX-${exchangeId.slice(0, 8)}-${Date.now()}`,
            customerId: exchangeRequest.order.customerId,
            status: 'confirmed',
            orderType: 'EXCHANGE',
            totalPrice: exchangeRequest.priceDifference,
            paymentStatus: exchangeRequest.priceDifference > 0 ? 'pending' : 'paid',
            fulfillmentStatus: 'unfulfilled',
            deliveryStatus: 'pending',
            note: `Exchange order from ${exchangeRequest.order.shopifyOrderId}. Original: ${exchangeRequest.originalProduct.title} → New: ${exchangeRequest.newProduct.title}`,
            shippingAddress: exchangeRequest.order.shippingAddress,
          },
        });

        updateData.newOrderId = newOrder.id;
        console.log(`✅ Exchange order created: ${newOrder.id} for exchange ${exchangeId}`);
      } catch (orderError: any) {
        console.error('⚠️ Failed to create exchange order:', orderError.message);
        // Don't fail the exchange approval if order creation fails
      }
    }

    // When shipped, store tracking number
    if (status === 'SHIPPED' && trackingNumber) {
      // Create a shipment record for the exchange
      if (exchangeRequest.newOrderId) {
        try {
          await prisma.shipment.create({
            data: {
              orderId: exchangeRequest.newOrderId,
              trackingNumber,
              courier: 'Exchange Shipment',
              status: 'shipped',
            },
          });
        } catch (shipErr: any) {
          console.error('⚠️ Shipment record creation failed:', shipErr.message);
        }
      }
    }

    if (newOrderId) {
      updateData.newOrderId = newOrderId;
    }

    const updatedExchange = await prisma.exchange.update({
      where: { id: exchangeId },
      data: updateData,
      include: {
        order: { include: { customer: true } },
        originalProduct: true,
        newProduct: true,
      },
    });

    return NextResponse.json({ success: true, exchange: updatedExchange }, { status: 200 });
  } catch (error: any) {
    console.error('Admin Exchange API Error:', error);
    return NextResponse.json({ error: 'Failed to update exchange request' }, { status: 500 });
  }
}

/**
 * GET /api/admin/exchanges/[id]
 * Fetch a single exchange with all details
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const exchange = await prisma.exchange.findUnique({
      where: { id: params.id },
      include: {
        order: { include: { items: true, customer: true } },
        originalProduct: true,
        newProduct: true,
      },
    });

    if (!exchange) {
      return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    }

    return NextResponse.json({ exchange }, { status: 200 });
  } catch (error: any) {
    console.error('Exchange Detail API Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch exchange' }, { status: 500 });
  }
}
