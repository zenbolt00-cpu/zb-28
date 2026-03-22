import { NextResponse } from 'next/server';
import { getShopConfig, adminUrl } from '@/lib/shopify-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Clear the global cache to force a real DB lookup
  if ((global as any)._cachedShopConfig) {
    (global as any)._cachedShopConfig = null;
  }
  const config = await getShopConfig();
  const url = await adminUrl('orders.json');
  return NextResponse.json({ config, url });
}
