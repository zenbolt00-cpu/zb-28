import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { adjustInventoryLevel, fetchLocations } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

type ScanMode = 'inventory_receive' | 'order_pack' | 'return_process' | 'audit';

interface ScanRequestBody {
  barcode?: string;
  sku?: string;
  mode?: ScanMode;
}

function normalizeSku(raw: string): string {
  return raw.trim().toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScanRequestBody;
    const mode: ScanMode = body.mode || 'inventory_receive';
    const rawCode = (body.barcode || body.sku || '').trim();

    if (!rawCode) {
      return NextResponse.json({ error: 'Missing barcode/sku' }, { status: 400 });
    }

    const normalizedSku = normalizeSku(rawCode);

    // Prefer SKU match (ZB26PH01TSXS pattern), fall back to barcode if needed
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: normalizedSku },
          { barcode: rawCode },
        ],
      },
      include: {
        inventory: true,
      },
    });

    if (!product || !product.inventoryItemId) {
      return NextResponse.json(
        {
          error: 'Product not found for scanned code',
          code: normalizedSku,
        },
        { status: 404 },
      );
    }

    // Resolve a Shopify location (re‑use logic from inventory adjust route)
    const locations = await fetchLocations();
    const activeLocation = locations.find((l) => l.active) || locations[0];

    if (!activeLocation) {
      return NextResponse.json(
        { error: 'No Shopify location found for inventory adjustments' },
        { status: 400 },
      );
    }

    const locationId = String(activeLocation.id);

    // Decide how inventory should change based on scan mode
    let delta = 0;
    if (mode === 'inventory_receive') {
      delta = 1;
    } else if (mode === 'return_process') {
      // Returned items go back into available stock
      delta = 1;
    } else if (mode === 'audit') {
      // Audit mode is read‑only – no Shopify adjustment
      const dbInventory = await prisma.inventory.findFirst({
        where: {
          productId: product.id,
          locationId,
        },
      });

      return NextResponse.json({
        success: true,
        mode,
        product: {
          id: product.id,
          title: product.title,
          sku: product.sku,
          barcode: product.barcode,
        },
        inventory: {
          locationId,
          stockQuantity: dbInventory?.stockQuantity ?? null,
        },
      });
    }

    if (delta === 0) {
      // For order_pack or unknown modes, just acknowledge the scan without mutating stock
      return NextResponse.json({
        success: true,
        mode,
        product: {
          id: product.id,
          title: product.title,
          sku: product.sku,
          barcode: product.barcode,
        },
        inventory: null,
      });
    }

    // Push adjustment to Shopify
    const updatedLevel = await adjustInventoryLevel(
      String(product.inventoryItemId),
      locationId,
      delta,
    );

    // Sync local DB inventory for this product/location
    const updatedInventory = await prisma.inventory.upsert({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId,
        },
      },
      create: {
        productId: product.id,
        locationId,
        stockQuantity: updatedLevel.available ?? 0,
        reservedQuantity: 0,
      },
      update: {
        stockQuantity: updatedLevel.available ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      mode,
      product: {
        id: product.id,
        title: product.title,
        sku: product.sku,
        barcode: product.barcode,
      },
      inventory: {
        locationId,
        stockQuantity: updatedInventory.stockQuantity,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Scanner API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process scan event' },
      { status: 500 },
    );
  }
}

