import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '';
const API_VERSION = '2025-07';

const STOREFRONT_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/${API_VERSION}/graphql.json`;

interface CartLineInput {
  variantId: string; // Expects Storefront GID e.g. "gid://shopify/ProductVariant/12345"
  quantity: number;
}

async function storefrontFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storefront API ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL: ${json.errors.map((e: any) => e.message).join(', ')}`);
  }

  return json.data as T;
}

/**
 * Normalise a variant ID to a Shopify Storefront GID.
 * Accepts either a raw numeric id like "12345678" or already-prefixed GIDs.
 */
function toVariantGid(id: string): string {
  if (id.startsWith('gid://')) return id;
  // Strip any existing prefix like "gid://shopify/ProductVariant/" if partially formed
  const numeric = id.replace(/\D/g, '');
  return `gid://shopify/ProductVariant/${numeric}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: Array<{ variantId: string; quantity: number }> = body.items;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // ── Step 1: Create Storefront Cart ───────────────────────────────────────
    const lines = items.map((item) => ({
      merchandiseId: toVariantGid(item.variantId),
      quantity: item.quantity,
    }));

    const CREATE_CART = `
      mutation cartCreate($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await storefrontFetch<{
      cartCreate: {
        cart: { id: string; checkoutUrl: string } | null;
        userErrors: { field: string[]; message: string }[];
      };
    }>(CREATE_CART, { lines });

    if (data.cartCreate.userErrors.length > 0) {
      const errors = data.cartCreate.userErrors.map((e) => e.message).join(', ');
      console.error('Shopify cart creation errors:', errors);
      return NextResponse.json({ error: errors }, { status: 422 });
    }

    if (!data.cartCreate.cart) {
      return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
    }

    const { checkoutUrl } = data.cartCreate.cart;

    return NextResponse.json({ checkoutUrl }, { status: 200 });
  } catch (err: any) {
    console.error('Checkout API error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
