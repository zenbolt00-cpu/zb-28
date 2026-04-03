import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId')?.trim();
    const phone = url.searchParams.get('phone')?.trim();
    const email = url.searchParams.get('email')?.trim();
    const limitRaw = url.searchParams.get('limit');
    const offsetRaw = url.searchParams.get('offset');
    const limit = limitRaw ? Math.max(1, Math.min(50, parseInt(limitRaw, 10) || 10)) : null;
    const offset = offsetRaw ? Math.max(0, parseInt(offsetRaw, 10) || 0) : 0;

    if (!customerId && !phone && !email) {
      return NextResponse.json(
        { orders: [], error: 'customerId, phone or email query parameter required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const whereClause: any = { OR: [] };
    if (customerId) whereClause.OR.push({ id: customerId });
    if (phone) whereClause.OR.push({ phone });
    if (email) whereClause.OR.push({ email });

    if (whereClause.OR.length === 0) {
      return NextResponse.json({ orders: [] }, { headers: corsHeaders });
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (customers.length === 0) {
      return NextResponse.json({ orders: [] }, { headers: corsHeaders });
    }

    const customerIds = customers.map((c: { id: string }) => c.id);

    const orders = await prisma.order.findMany({
      where: { customerId: { in: customerIds } },
      include: {
        items: {
          include: {
            product: { select: { id: true, shopifyProductId: true, title: true } },
          },
        },
        shipments: true,
        returns: true,
        exchanges: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { skip: offset, take: limit } : {}),
    });

    const formatted = orders.map((o: any) => {
      const latestShipment = o.shipments?.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      let parsedShippingAddress = null;
      if (o.shippingAddress) {
        try {
          parsedShippingAddress = JSON.parse(o.shippingAddress);
        } catch {
          parsedShippingAddress = { raw: o.shippingAddress };
        }
      }

      return {
        id: o.id,
        orderNumber: o.shopifyOrderId,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        status: o.status,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        deliveryStatus: o.deliveryStatus,
        trackingNumber: latestShipment?.trackingNumber || null,
        trackingUrl: latestShipment?.trackingNumber
          ? `https://www.delhivery.com/track/package/${latestShipment.trackingNumber}`
          : null,
        courier: latestShipment?.courier || null,
        shipmentCreatedAt: latestShipment?.createdAt || null,
        totalPrice: o.totalPrice,
        subtotalPrice: o.subtotalPrice,
        currency: o.currency,
        note: o.note,
        paymentMethod: o.payments?.[0]?.gateway || null,
        shippingAddress: parsedShippingAddress,
        items: o.items.map((item: any) => ({
          id: item.id,
          lineItemId: item.shopifyLineItemId,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
          productId: item.productId,
          image: item.product?.shopifyProductId
            ? null // app can resolve images from Shopify product ID if needed
            : null,
        })),
        returns: (o.returns || []).map((r: any) => ({
          id: r.id,
          productId: r.productId,
          reason: r.reason,
          status: r.status,
          requestedAt: r.requestedAt,
        })),
        exchanges: (o.exchanges || []).map((e: any) => ({
          id: e.id,
          originalProductId: e.originalProductId,
          newProductId: e.newProductId,
          status: e.status,
          priceDifference: e.priceDifference,
          createdAt: e.createdAt,
        })),
        timeline: {
          placedAt: o.createdAt,
          confirmedAt: o.paymentStatus === 'paid' ? o.updatedAt : null,
          packedAt:
            (o.fulfillmentStatus && String(o.fulfillmentStatus).toLowerCase() !== 'unfulfilled')
              ? o.updatedAt
              : null,
          shippedAt: latestShipment?.createdAt || (o.fulfillmentStatus ? o.updatedAt : null),
          outForDeliveryAt:
            String(o.deliveryStatus || '').toLowerCase() === 'out_for_delivery' ? o.updatedAt : null,
          deliveredAt: String(o.deliveryStatus || '').toLowerCase() === 'delivered' ? o.updatedAt : null,
        },
      };
    });

    // Optional pagination metadata (kept non-breaking: existing callers can ignore).
    let hasMore: boolean | undefined = undefined;
    if (limit) {
      const total = await prisma.order.count({
        where: { customerId: { in: customerIds } },
      });
      hasMore = offset + formatted.length < total;
      return NextResponse.json({ orders: formatted, page: { limit, offset, total, hasMore } }, { headers: corsHeaders });
    }

    return NextResponse.json({ orders: formatted }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[App API] Orders error:', error.message);
    return NextResponse.json(
      { orders: [], error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lineItems, customer, shippingAddress, billingAddress, financialStatus, tags, note } = body;

    if (!lineItems?.length || !customer) {
      return NextResponse.json(
        { success: false, error: 'lineItems and customer are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Direct order creation via this endpoint is disabled. Use checkout flow.' },
      { status: 403, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[App API] Create order error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
