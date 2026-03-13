import { NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '250', 10);

    const products = await fetchAllProducts(pageSize);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Shopify Products API Error:', error.message);
    return NextResponse.json(
      { products: [], error: error.message },
      { status: 200 },
    );
  }
}
