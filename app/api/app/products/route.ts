import { NextResponse } from 'next/server';
import { fetchAllProducts, fetchCollectionByHandle, resolveShopifyGid, ShopifyProduct } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

// Transform Shopify Admin product to the flat shape the React Native app expects
function normalizeMetaKey(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

function getMetafieldRaw(p: ShopifyProduct, keys: string[]): string | undefined {
  if (!p.metafields?.length) return undefined;
  const keySet = new Set(keys.map(normalizeMetaKey));
  const metafield = p.metafields.find(
    (m) => m.namespace === 'custom' && keySet.has(normalizeMetaKey(m.key))
  );
  return metafield?.value || undefined;
}

async function resolveMetafieldValue(value?: string): Promise<string | undefined> {
  if (!value) return undefined;
  if (!value.startsWith('gid://shopify/')) return value;
  return (await resolveShopifyGid(value)) || undefined;
}

async function flattenProduct(p: ShopifyProduct) {
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
  const allMedia: Array<{
    mediaContentType: 'IMAGE' | 'VIDEO';
    image?: { url: string; altText: null };
    alt: null;
    sources?: { url: string; mimeType: string }[];
  }> = (p.images || []).map((img) => ({
    mediaContentType: 'IMAGE' as const,
    image: { url: img.src, altText: null },
    alt: null,
  }));

  const [productVideo, sizeChart] = await Promise.all([
    resolveMetafieldValue(getMetafieldRaw(p, ['product_video', 'product-video', 'product video'])),
    resolveMetafieldValue(getMetafieldRaw(p, ['size_chart', 'size-chart', 'size chart', 'size_chart_image', 'size-chart-image', 'size chart image'])),
  ]);

  if (productVideo) {
    allMedia.push({
      mediaContentType: 'VIDEO',
      alt: null,
      sources: [{ url: productVideo, mimeType: 'video/mp4' }],
    });
  }

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
    sizeChart,
    productVideo,
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

    const flat = await Promise.all(products.map(flattenProduct));

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
