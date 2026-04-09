import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createRefund } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/returns/[id]
 * Update return status with full workflow support:
 *   REQUESTED → APPROVED → RECEIVED → REFUNDED
 *   REQUESTED → REJECTED
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, refundAmount, refundMethod } = body;
    const returnId = params.id;

    const validStatuses = ['APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'PICKUP_SCHEDULED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        order: { include: { items: true, shop: true } },
        product: true,
        customer: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = { status };

    if (status === 'REFUNDED') {
      updateData.refundAmount = refundAmount || returnRequest.refundAmount;
      updateData.refundStatus = 'COMPLETED';
    }

    if (status === 'APPROVED') {
      // Calculate refund amount from the matching line item
      const matchingItem = returnRequest.order.items.find(
        (item) => !returnRequest.sku || item.sku === returnRequest.sku
      );
      if (matchingItem) {
        updateData.refundAmount = matchingItem.price * (matchingItem.quantity || 1);
      }
    }

    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: updateData,
      include: {
        order: true,
        customer: true,
        product: true,
      },
    });

    // When marked REFUNDED, create a Shopify refund for the relevant line items
    if (status === 'REFUNDED') {
      try {
        const orderId = returnRequest.order.shopifyOrderId;
        const sku = returnRequest.sku;

        // Find the matching line item by SKU
        const matchingLineItem = returnRequest.order.items.find(
          (item) => !sku || item.sku === sku
        );

        if (matchingLineItem?.shopifyLineItemId) {
          await createRefund(
            orderId,
            [
              {
                line_item_id: parseInt(matchingLineItem.shopifyLineItemId, 10),
                quantity: 1,
                restock_type: 'return',
              },
            ],
            `Return approved: ${returnRequest.reason}`
          );
          console.log(`✅ Shopify refund created for order ${orderId}`);
        }
      } catch (refundError: any) {
        console.error('⚠️ Shopify Refund Error:', refundError.message);
        // Update refund status to failed but don't fail the entire status update
        await prisma.return.update({
          where: { id: returnId },
          data: { refundStatus: 'FAILED' },
        });
      }
    }

    // TODO: Send push notification via Pusher when status changes to APPROVED or REFUNDED
    // This would notify the mobile app in real-time

    return NextResponse.json({ success: true, return: updatedReturn }, { status: 200 });
  } catch (error: any) {
    console.error('Admin Return API Error:', error);
    return NextResponse.json({ error: 'Failed to update return request' }, { status: 500 });
  }
}

/**
 * GET /api/admin/returns/[id]
 * Fetch a single return with full details
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const returnRequest = await prisma.return.findUnique({
      where: { id: params.id },
      include: {
        order: { include: { items: true } },
        customer: true,
        product: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    return NextResponse.json({ return: returnRequest }, { status: 200 });
  } catch (error: any) {
    console.error('Return Detail API Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch return' }, { status: 500 });
  }
}
