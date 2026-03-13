import { NextResponse } from 'next/server';
import { createFulfillment, fetchLocations } from '@/lib/shopify-admin';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shopify/orders/[id]/fulfill
 * Creates an order fulfillment in Shopify.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { locationId, lineItems } = body;

    // If no locationId provided, use the first active location
    let resolvedLocationId = locationId;
    if (!resolvedLocationId) {
      const locations = await fetchLocations();
      const activeLocation = locations.find((l) => l.active);
      if (!activeLocation) {
        return NextResponse.json({ error: 'No active Shopify location found' }, { status: 400 });
      }
      resolvedLocationId = String(activeLocation.id);
    }

    const fulfillment = await createFulfillment(params.id, resolvedLocationId, lineItems);

    // Update local DB order status
    try {
      await prisma.order.update({
        where: { shopifyOrderId: params.id },
        data: { fulfillmentStatus: 'fulfilled' },
      });
    } catch (_e) {
      // Order may not be in local DB yet, ignore
    }

    return NextResponse.json({ success: true, fulfillment });
  } catch (error: any) {
    console.error('Fulfillment Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
