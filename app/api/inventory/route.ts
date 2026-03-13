import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // Allow ?shop= override, fall back to env variable
    const shopDomain =
      url.searchParams.get('shop') ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      '8tiahf-bk.myshopify.com';

    const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found. Run /api/shopify/sync first.' }, { status: 404 });
    }

    const inventory = await prisma.product.findMany({
      where: { shopId: shop.id },
      include: {
        inventory: true,
      },
    });

    return NextResponse.json({ inventory }, { status: 200 });
  } catch (error) {
    console.error('API Inventory Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, locationId, adjustmentQuantity } = body;
    const shopDomain =
      body.shopDomain ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      '8tiahf-bk.myshopify.com';

    if (!productId || !locationId || typeof adjustmentQuantity !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const existingInventory = await prisma.inventory.findUnique({
      where: {
        productId_locationId: { productId, locationId },
      },
    });

    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }

    const newQuantity = existingInventory.stockQuantity + adjustmentQuantity;

    const updatedInventory = await prisma.inventory.update({
      where: {
        productId_locationId: { productId, locationId },
      },
      data: {
        stockQuantity: newQuantity,
      },
    });

    return NextResponse.json({ success: true, inventory: updatedInventory }, { status: 200 });
  } catch (error) {
    console.error('API Inventory Adjustment Error:', error);
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 });
  }
}
