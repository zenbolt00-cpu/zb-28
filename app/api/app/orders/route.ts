import { NextResponse } from 'next/server';
import { fetchOrdersByCustomerId, createOrder, ShopifyOrder } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { orders: [], error: 'customerId parameter is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const orders = await fetchOrdersByCustomerId(customerId);

    // Transform to a simpler format for the app
    const flatOrders = orders.map((o: ShopifyOrder) => ({
      id: String(o.id),
      name: o.name,
      orderNumber: o.order_number,
      email: o.email,
      createdAt: o.created_at,
      totalPrice: o.total_price,
      subtotalPrice: o.subtotal_price,
      currency: o.currency,
      financialStatus: o.financial_status,
      fulfillmentStatus: o.fulfillment_status,
      lineItems: (o.line_items || []).map(li => ({
        id: String(li.id),
        title: li.title,
        quantity: li.quantity,
        price: li.price,
        sku: li.sku,
        variantTitle: li.variant_title,
      })),
      shippingAddress: o.shipping_address ? {
        name: `${o.shipping_address.first_name} ${o.shipping_address.last_name}`,
        address1: o.shipping_address.address1,
        city: o.shipping_address.city,
        province: o.shipping_address.province,
        zip: o.shipping_address.zip,
        country: o.shipping_address.country,
      } : null,
      note: o.note,
      tags: o.tags,
    }));

    return NextResponse.json({ orders: flatOrders }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('[App API] Orders error:', error.message);
    return NextResponse.json(
      { orders: [], error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const order = await createOrder({
      line_items: body.lineItems || body.line_items || [],
      customer: body.customer,
      shipping_address: body.shippingAddress || body.shipping_address,
      billing_address: body.billingAddress || body.billing_address,
      financial_status: body.financialStatus || 'pending',
      tags: body.tags || 'mobile-app',
      note: body.note || '',
    });

    return NextResponse.json({ success: true, order: { id: String(order.id), name: order.name } }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('[App API] Create order error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
