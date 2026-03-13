import { NextResponse } from 'next/server';
import { fetchAllCustomers } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '250', 10);

    const customers = await fetchAllCustomers(pageSize);

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Shopify Customers API Error:', error.message);
    return NextResponse.json(
      { customers: [], error: error.message },
      { status: 200 },
    );
  }
}
