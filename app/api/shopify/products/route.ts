import { NextResponse } from 'next/server';
import { fetchAllProducts, fetchCollectionByHandle } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '250', 10);
    const collectionHandle = url.searchParams.get('collection');

    let products = [];
    if (collectionHandle) {
      const { products: collectionProducts } = await fetchCollectionByHandle(collectionHandle, pageSize);
      products = collectionProducts;
    } else {
      products = await fetchAllProducts(pageSize);
    }

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
