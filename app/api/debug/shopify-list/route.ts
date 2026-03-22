import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com';
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
  const API_VERSION = '2025-01';

  try {
    const url = `https://${domain}/admin/api/${API_VERSION}/customers.json?limit=10`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text, status: res.status }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      domain,
      count: data.customers?.length || 0,
      customers: data.customers?.map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        email: c.email
      })) || []
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message
    }, { status: 500 });
  }
}
