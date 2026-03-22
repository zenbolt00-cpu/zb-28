import { NextResponse } from 'next/server';
import { fetchProductByHandle, ShopifyProduct } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

function getMetafieldText(p: ShopifyProduct, key: string): string | undefined {
  const mf = p.metafields?.find(m => m.namespace === 'custom' && m.key === key);
  if (!mf?.value) return undefined;
  try {
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

  const allMedia = (p.images || []).map(img => ({
    mediaContentType: 'IMAGE' as const,
    image: { url: img.src, altText: null },
    alt: null,
  }));

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
    allMedia,
    details: getMetafieldText(p, 'details'),
    care: getMetafieldText(p, 'care'),
    sizeChart: p.metafields?.find(m => m.namespace === 'custom' && m.key === 'size_chart')?.value,
    productVideo: p.metafields?.find(m => m.namespace === 'custom' && m.key === 'product_video')?.value || undefined,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const product = await fetchProductByHandle(params.handle);

    if (!product) {
      return NextResponse.json(
        { product: null, error: 'Product not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return NextResponse.json({ product: flattenProduct(product) }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[App API] Product by handle error:', error.message);
    return NextResponse.json(
      { product: null, error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
