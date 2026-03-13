import { NextResponse } from 'next/server';
import {
  adminUrl,
  headers,
  ShopifyOrder,
  fetchAllOrders,
} from '@/lib/shopify-admin';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Construct the Shopify order payload
    const payload = {
      order: {
        line_items: body.line_items || [],
        customer: body.customer ? {
          first_name: body.customer.first_name,
          last_name: body.customer.last_name,
          email: body.customer.email,
        } : undefined,
        shipping_address: body.shipping_address,
        billing_address: body.billing_address || body.shipping_address,
        financial_status: body.financial_status || 'pending',
        tags: body.tags || '',
        note: body.note || '',
      }
    };

    const res = await fetch(await adminUrl('orders.json'), {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Shopify Create Order Error:', res.status, text);
      return NextResponse.json(
        { error: 'Failed to create order on Shopify', details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, order: data.order as ShopifyOrder });
  } catch (error: any) {
    console.error('Error in create order route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'any';
    
    // Fetch all orders for the given status (paginated under the hood)
    const orders = await fetchAllOrders(250, status);
    
    // Enrich with local delivery status
    const shopifyOrderIds = orders.map(o => String(o.id));
    const localOrders = await prisma.order.findMany({
      where: { shopifyOrderId: { in: shopifyOrderIds } },
      select: { shopifyOrderId: true, deliveryStatus: true }
    });
    
    const deliveryMap = Object.fromEntries(localOrders.map(o => [o.shopifyOrderId, o.deliveryStatus]));
    const enrichedOrders = orders.map(o => ({
      ...o,
      deliveryStatus: deliveryMap[String(o.id)] || 'pending'
    }));
    
    return NextResponse.json({ orders: enrichedOrders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
