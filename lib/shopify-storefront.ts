const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '';
const API_VERSION = '2025-07';

function storefrontUrl(): string {
  return `https://${SHOPIFY_STORE_DOMAIN}/api/${API_VERSION}/graphql.json`;
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
  };
}

/**
 * Execute a GraphQL query against the Shopify Storefront API.
 */
export async function shopifyStorefrontFetch<T>(query: string, variables?: any): Promise<T> {
  const url = storefrontUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Shopify Storefront API error [${res.status}]: ${text}`);
    throw new Error(`Shopify Storefront API ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    console.error('Shopify Storefront GraphQL errors:', json.errors);
    throw new Error(`GraphQL Error: ${json.errors.map((e: any) => e.message).join(', ')}`);
  }

  return json.data;
}

// ─── Example Storefront Operations ───────────────────────────────────

export interface StorefrontProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: {
          amount: string;
          currencyCode: string;
        };
      };
    }[];
  };
}

export async function getStorefrontProducts(first = 50): Promise<StorefrontProduct[]> {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            availableForSale
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{ products: { edges: { node: StorefrontProduct }[] } }>(query, { first });
  return data.products.edges.map((e) => e.node);
}

export async function getStorefrontProductByHandle(handle: string): Promise<StorefrontProduct | null> {
  const query = `
    query getProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        availableForSale
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{ product: StorefrontProduct | null }>(query, { handle });
  return data.product;
}
