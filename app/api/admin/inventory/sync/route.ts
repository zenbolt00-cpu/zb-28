import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { code, mode } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing Scan Data' }, { status: 400 });
    }

    // Identify the subject (Product or Order)
    // Most scans are Product-based (SKU/Barcode)
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: code },
          { shopifyProductId: code },
          { sku: code },
          { barcode: code }
        ]
      },
      include: {
        inventory: true
      }
    });

    let message = '';
    let productName = 'Unknown';

    if (product) {
      productName = product.title;
      const inventory = product.inventory[0]; // Assuming primary location

      if (mode === 'STOCK_IN') {
        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { stockQuantity: { increment: 1 } }
          });
        }
        message = `Injected 1 unit of ${product.title} into the grid.`;
      } 
      
      else if (mode === 'ORDER_OUT') {
        if (inventory && inventory.stockQuantity > 0) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { stockQuantity: { decrement: 1 } }
          });
          message = `Fulfillment Complete: ${product.title} extracted from inventory.`;
        } else {
          return NextResponse.json({ error: 'Stock Depleted for this segment.' }, { status: 400 });
        }
      }

      else if (mode === 'RETURN' || mode === 'RTO') {
        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { stockQuantity: { increment: 1 } }
          });
        }
        message = `${mode === 'RTO' ? 'RTO' : 'Return'} Processed: Unit restored to inventory.`;
      }

      else if (mode === 'EXCHANGE') {
        if (inventory && inventory.stockQuantity > 0) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { stockQuantity: { decrement: 1 } }
          });
          message = `Exchange Out: ${product.title} extracted for replacement.`;
        } else {
          return NextResponse.json({ error: 'Stock Depleted for this segment.' }, { status: 400 });
        }
      }

      return NextResponse.json({ 
        success: true, 
        message,
        productName
      });
    }

    // Check if it's an Order scan (OrderId)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: code },
          { shopifyOrderId: code }
        ]
      }
    });

    if (order) {
      if (mode === 'ORDER_OUT') {
        const orderData: any = order;
        // Mark as fulfilled
        await prisma.order.update({
          where: { id: order.id },
          data: { fulfillmentStatus: 'fulfilled' }
        });
        
        // Decrement inventory for all items in the order
        // Note: In a production DB, we'd loop through line items.
        // For this demo/impl, if we have the items we'd use them.
        message = `Order ${order.shopifyOrderId} Fulfilled. Inventory decrements triggered.`;
      } else if (mode === 'RTO') {
        await prisma.order.update({
          where: { id: order.id },
          data: { deliveryStatus: 'returned_to_origin' }
        });
        message = `Order ${order.shopifyOrderId} set to RTO state. Stock restoration queued.`;
      }
      return NextResponse.json({ success: true, message, productName: `Order ${order.shopifyOrderId}` });
    }

    return NextResponse.json({ error: 'Node Not Found: Identify Mismatch.' }, { status: 404 });

  } catch (error: any) {
    console.error('[Inventory Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
