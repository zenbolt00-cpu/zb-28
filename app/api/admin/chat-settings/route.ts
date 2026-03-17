import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shop = await prisma.shop.findFirst();
    const chatAccessMode = (shop as any)?.chatAccessMode || 'open';
    return NextResponse.json({ chatAccessMode });
  } catch (error) {
    console.error('Chat Settings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { chatAccessMode } = await req.json();
    
    if (!['open', 'orders_only'].includes(chatAccessMode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const shop = await prisma.shop.findFirst();
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    await prisma.shop.update({
      where: { id: shop.id },
      data: { chatAccessMode } as any,
    });

    return NextResponse.json({ success: true, chatAccessMode });
  } catch (error) {
    console.error('Chat Settings PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
