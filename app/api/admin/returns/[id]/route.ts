import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createRefund } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const returnId = params.id;

    const validStatuses = ['approved', 'rejected', 'received', 'refunded', 'pickup_scheduled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 });
    }

    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        order: { include: { items: true } },
        product: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: { status },
    });

    // When marked refunded, create a Shopify refund for the relevant line items
    if (status === 'refunded') {
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
          console.log(`Shopify refund created for order ${orderId}`);
        }
      } catch (refundError: any) {
        console.error('Shopify Refund Error:', refundError.message);
        // Continue — don't fail the status update if Shopify refund fails
      }
    }

    return NextResponse.json({ success: true, return: updatedReturn }, { status: 200 });
  } catch (error) {
    console.error('Admin Return API Error:', error);
    return NextResponse.json({ error: 'Failed to update return request' }, { status: 500 });
  }
}
