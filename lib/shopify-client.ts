import prisma from './db';

const API_VERSION = '2025-01';
export { API_VERSION };

// Declare global for caching config to avoid 'any'
declare global {
  // eslint-disable-next-line no-var
  var _cachedShopConfig: { domain: string; accessToken: string } | undefined;
}

export async function getShopConfig() {
  try {
    if (global._cachedShopConfig) return global._cachedShopConfig;
    const shop = await prisma.shop.findFirst();
    
    const accessToken = shop?.accessToken;
    const dbDomain = shop?.domain;

    const isDbTokenPlaceholder = !accessToken || 
      ['test_token', 'shpat_placeholder', 'shpat_required', 'shpat_env_token'].includes(accessToken) || 
      accessToken === '';
      
    const isDefaultDomain = !dbDomain || dbDomain === '8tiahf-bk.myshopify.com';
    
    const finalDomain = !isDefaultDomain
      ? (dbDomain as string)
      : (process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || dbDomain || '8tiahf-bk.myshopify.com');

    const finalToken = !isDbTokenPlaceholder 
      ? (accessToken as string) 
      : (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '');
    
    const config = {
      domain: finalDomain,
      accessToken: finalToken,
    };

    if (accessToken && shop) {
      global._cachedShopConfig = config;
    }

    return config;
  } catch (error) {
    console.warn('[Shopify Admin] Database access failed during config fetch:', error);
    return {
      domain: process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com',
      accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    };
  }
}

export async function adminUrl(endpoint: string): Promise<string> {
  const { domain } = await getShopConfig();
  return `https://${domain}/admin/api/${API_VERSION}/${endpoint}`;
}

export async function headers(): Promise<HeadersInit> {
  const { accessToken } = await getShopConfig();
  if (!accessToken) {
    console.error('[Shopify Client] No access token found for headers');
  }
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken || '',
  };
}

export async function shopifyFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(await adminUrl(endpoint));
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: await headers(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data as T;
}

export function clearShopConfigCache() {
  global._cachedShopConfig = undefined;
}

