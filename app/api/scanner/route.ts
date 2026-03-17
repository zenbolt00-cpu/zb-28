import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { adjustInventoryLevel, fetchLocations } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

type ScanMode = 'stock_in' | 'order_out' | 'return_process' | 'exchange' | 'rto' | 'audit';

interface ScanRequestBody {
  barcode?: string;
  sku?: string;
  mode?: ScanMode;
  staffName?: string;
  quantity?: number;
}

function normalizeSku(raw: string): string {
  return raw.trim().toUpperCase();
}

const MODE_MAP: Record<string, string> = {
  'stock_in': 'STOCK_IN',
  'inventory_receive': 'STOCK_IN',
  'order_out': 'ORDER_OUT',
  'order_pack': 'ORDER_OUT',
  'return_process': 'RETURN',
  'exchange': 'EXCHANGE',
  'rto': 'RTO',
  'audit': 'AUDIT',
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScanRequestBody;
    const mode = body.mode || 'stock_in';
    const rawCode = (body.barcode || body.sku || '').trim();
    const staffName = body.staffName || 'Admin';
    const quantity = body.quantity || 1;

    if (!rawCode) {
      return NextResponse.json({ error: 'Missing barcode/sku' }, { status: 400 });
    }

    const normalizedSku = normalizeSku(rawCode);
    const actionType = MODE_MAP[mode] || 'STOCK_IN';

    // Find product by SKU or barcode
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
      // Log failed scan
      await (prisma as any).scanRecord.create({
        data: {
          sku: normalizedSku,
          barcode: rawCode,
          actionType,
          quantity: 0,
          staffName,
          productTitle: 'NOT FOUND',
        }
      });

      return NextResponse.json(
        { error: 'Product not found for scanned code', code: normalizedSku },
        { status: 404 },
      );
    }

    // Resolve Shopify location
    const locations = await fetchLocations();
    const activeLocation = locations.find((l) => l.active) || locations[0];

    if (!activeLocation) {
      return NextResponse.json(
        { error: 'No Shopify location found' },
        { status: 400 },
      );
    }

    const locationId = String(activeLocation.id);

    // Get current stock before adjustment
    const beforeInventory = await prisma.inventory.findFirst({
      where: { productId: product.id, locationId },
    });
    const beforeStock = beforeInventory?.stockQuantity ?? 0;

    // Determine delta based on scan mode
    let delta = 0;
    switch (actionType) {
      case 'STOCK_IN':
        delta = quantity;        // Add stock
        break;
      case 'ORDER_OUT':
        delta = -quantity;       // Remove stock on dispatch
        break;
      case 'RETURN':
        delta = quantity;        // Return adds stock back
        break;
      case 'EXCHANGE':
        delta = 0;               // Exchange is neutral (decrement + increment handled separately)
        break;
      case 'RTO':
        delta = quantity;        // RTO returns stock
        break;
      case 'AUDIT':
        delta = 0;               // Audit is read-only
        break;
    }

    // For audit mode — return current state without modification
    if (actionType === 'AUDIT') {
      await (prisma as any).scanRecord.create({
        data: {
          productId: product.id,
          productTitle: product.title,
          variantInfo: product.sku || null,
          sku: product.sku,
          barcode: product.barcode,
          actionType: 'AUDIT',
          quantity: 0,
          beforeStock,
          afterStock: beforeStock,
          locationId,
          staffName,
        }
      });

      return NextResponse.json({
        success: true,
        mode: actionType,
        product: {
          id: product.id,
          title: product.title,
          sku: product.sku,
          barcode: product.barcode,
        },
        inventory: {
          locationId,
          stockQuantity: beforeStock,
        },
      });
    }

    if (delta === 0 && actionType !== 'EXCHANGE') {
      return NextResponse.json({
        success: true,
        mode: actionType,
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
    let afterStock = beforeStock;
    if (delta !== 0) {
      const updatedLevel = await adjustInventoryLevel(
        String(product.inventoryItemId),
        locationId,
        delta,
      );

      // Sync local DB
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

      afterStock = updatedInventory.stockQuantity;
    }

    // Log the scan record
    await (prisma as any).scanRecord.create({
      data: {
        productId: product.id,
        productTitle: product.title,
        variantInfo: product.sku || null,
        sku: product.sku,
        barcode: product.barcode,
        actionType,
        quantity,
        beforeStock,
        afterStock,
        locationId,
        staffName,
      }
    });

    return NextResponse.json({
      success: true,
      mode: actionType,
      product: {
        id: product.id,
        title: product.title,
        sku: product.sku,
        barcode: product.barcode,
      },
      inventory: {
        locationId,
        stockQuantity: afterStock,
        beforeStock,
      },
    });
  } catch (error) {
    console.error('Scanner API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process scan event' },
      { status: 500 },
    );
  }
}
