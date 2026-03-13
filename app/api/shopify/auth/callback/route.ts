import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  const code = url.searchParams.get('code');

  if (!shop || !code) {
    return NextResponse.json({ error: 'Missing shop or code parameter' }, { status: 400 });
  }

  try {
    // In a real environment, exchange the code for an access token via POST to Shopify
    // For this build, we mock the access token response to ensure safe deployment on Vercel without active Shopify keys.
    const mockAccessToken = `shpca_${Math.random().toString(36).substring(2, 15)}`;

    await prisma.shop.upsert({
      where: { domain: shop },
      create: { domain: shop, accessToken: mockAccessToken },
      update: { accessToken: mockAccessToken, updatedAt: new Date() },
    });

    const apiKey = process.env.SHOPIFY_API_KEY || 'test_api_key';
    const storeName = shop.replace('.myshopify.com', '');
    
    // Redirect to the embedded App inside Shopify Admin
    const appBaseUrl = `https://admin.shopify.com/store/${storeName}/apps/${apiKey}`;
    return NextResponse.redirect(appBaseUrl);

  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: 'Failed to complete OAuth' }, { status: 500 });
  }
}
