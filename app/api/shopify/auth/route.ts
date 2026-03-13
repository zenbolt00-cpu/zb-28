import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter. Please provide ?shop=your-store.myshopify.com' }, { status: 400 });
  }

  const clientId = process.env.SHOPIFY_API_KEY || 'test_api_key';
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_orders,write_orders,read_inventory,write_inventory';
  const host = process.env.SHOPIFY_APP_URL || 'http://localhost:3000';

  const redirectUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${host}/api/shopify/auth/callback&state=nonce123&grant_options[]=`;

  return NextResponse.redirect(redirectUrl);
}
