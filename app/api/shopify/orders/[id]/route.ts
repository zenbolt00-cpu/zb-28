import { NextResponse } from 'next/server';
import { adminUrl, headers, ShopifyOrder } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 },
      );
    }

    const res = await fetch(await adminUrl(`orders/${orderId}.json`), {
      method: 'GET',
      headers: await headers(),
    });

    if (!res.ok) {
      const text = await res.text();
      // eslint-disable-next-line no-console
      console.error(
        `Shopify Get Order Error for ${orderId}:`,
        res.status,
        text,
      );
      return NextResponse.json(
        { error: `Failed to fetch order ${orderId}`, details: text },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { order: data.order as ShopifyOrder },
      { status: 200 },
    );
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error in get order route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Construct the Shopify update payload. 
    // Shopify only allows updating specific fields like note, tags, email, shipping_address
    const payload = {
      order: {
        id: parseInt(orderId, 10),
        note: body.note,
        tags: body.tags,
        shipping_address: body.shipping_address,
        email: body.email,
      }
    };

    const res = await fetch(await adminUrl(`orders/${orderId}.json`), {
      method: 'PUT', // Shopify uses PUT for partial updates to the order resource
      headers: await headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`Shopify Update Order Error for ${orderId}:`, res.status, text);
        return NextResponse.json(
          { error: `Failed to update order ${orderId}`, details: text },
          { status: res.status }
        );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, order: data.order as ShopifyOrder });

  } catch (error: any) {
    console.error('Error in update order route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
