import { NextResponse } from 'next/server';
import { fetchAllProducts, fetchCollectionByHandle, ShopifyProduct } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

// Transform Shopify Admin product to the flat shape the React Native app expects
function flattenProduct(p: ShopifyProduct) {
  const variants = (p.variants || []).map(v => ({
    id: `gid://shopify/ProductVariant/${v.id}`,
    title: v.title,
    availableForSale: (v.inventory_quantity ?? 0) > 0,
    quantityAvailable: v.inventory_quantity ?? 0,
    price: v.price,
    compareAtPrice: v.compare_at_price || null,
    size: v.option1 || null,
  }));

  const price = variants[0]?.price || '0';
  const compareAtPrice = variants[0]?.compareAtPrice || null;
  const isOnSale = compareAtPrice ? parseFloat(compareAtPrice) > parseFloat(price) : false;
  const isSoldOut = !variants.some(v => v.availableForSale);

  // Build media array from images
  const allMedia = (p.images || []).map(img => ({
    mediaContentType: 'IMAGE' as const,
    image: { url: img.src, altText: null },
    alt: null,
  }));

  // Check metafields for video
  const videoMetafield = p.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'product_video'
  );

  return {
    id: `gid://shopify/Product/${p.id}`,
    title: p.title,
    handle: p.handle,
    productType: p.product_type || '',
    description: p.body_html ? p.body_html.replace(/<[^>]*>/g, '') : '',
    descriptionHtml: p.body_html || '',
    availableForSale: !isSoldOut,
    featuredImage: p.image?.src || p.images?.[0]?.src || '',
    images: (p.images || []).map(img => img.src),
    price,
    compareAtPrice,
    variants,
    isSoldOut,
    isOnSale,
    video: undefined,
    allMedia,
    details: getMetafieldText(p, 'details'),
    care: getMetafieldText(p, 'care'),
    sizeChart: p.metafields?.find(m => m.namespace === 'custom' && m.key === 'size_chart')?.value,
    productVideo: videoMetafield?.value || undefined,
  };
}

function getMetafieldText(p: ShopifyProduct, key: string): string | undefined {
  const mf = p.metafields?.find(m => m.namespace === 'custom' && m.key === key);
  if (!mf?.value) return undefined;
  try {
    // Try parsing rich text JSON
    const data = JSON.parse(mf.value);
    let text = '';
    const extract = (node: any) => {
      if (node.type === 'text') text += node.value;
      if (node.children) node.children.forEach(extract);
      if (node.type === 'list-item') text += '\n• ';
      if (node.type === 'paragraph' || node.type === 'list') text += '\n';
    };
    extract(data);
    return text.trim();
  } catch {
    return mf.value;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '24', 10);
    const collectionHandle = url.searchParams.get('collection');

    let products: ShopifyProduct[] = [];
    if (collectionHandle) {
      const result = await fetchCollectionByHandle(collectionHandle, limit);
      products = result.products;
    } else {
      products = await fetchAllProducts(limit);
    }

    const flat = products.map(flattenProduct);

    return NextResponse.json({ products: flat }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[App API] Products error:', error.message);
    return NextResponse.json(
      { products: [], error: error.message },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
