import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shopifyOrderId = params.id;

    if (!shopifyOrderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.updateMany({
      where: { shopifyOrderId },
      data: { deliveryStatus: 'delivered' },
    });

    if (updatedOrder.count === 0) {
      // Order might not exist locally yet if sync hasn't run.
      // We can't update deliveryStatus if it doesn't exist.
      return NextResponse.json(
        { error: 'Order not found in local database. Please run Full Sync first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deliveryStatus: 'delivered' });
  } catch (error: any) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
