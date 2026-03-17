import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const messages = await prisma.communityMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        customer: {
          select: { 
            id: true,
            name: true,
            image: true
          }
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            customerId: true,
          }
        }
      }
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Community Chat GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, content, imageUrl } = body;

    if (!email || (!content && !imageUrl)) {
      return NextResponse.json({ error: 'Email and content/image are required' }, { status: 400 });
    }

    // Find the customer
    const customer = await prisma.customer.findFirst({
      where: { email },
      include: { 
        communityMember: true,
        orders: { take: 1 }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // Check chat access mode from shop settings
    const shop = await prisma.shop.findFirst();
    const chatAccessMode = (shop as any)?.chatAccessMode || 'open';

    if (chatAccessMode === 'orders_only') {
      // Only enforce order check when mode is "orders_only"
      const orderCount = customer.ordersCount || customer.orders.length || 0;
      if (orderCount < 1) {
        return NextResponse.json({ 
          error: 'Chat access requires at least one confirmed order.' 
        }, { status: 403 });
      }
    }
    // In "open" mode, all registered users can send messages

    const message = await prisma.communityMessage.create({
      data: {
        customerId: customer.id,
        content: content || '',
        imageUrl: imageUrl || null,
      },
      include: {
        customer: { 
          select: { 
            id: true,
            name: true,
            image: true
          } 
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            customerId: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Community Chat POST Error:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}

// Toggle reaction on a message
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, messageId, emoji } = body;

    if (!email || !messageId) {
      return NextResponse.json({ error: 'Email and messageId required' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({ where: { email } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const reactionEmoji = emoji || '❤️';

    // Toggle: remove if exists, create if not
    const existing = await (prisma as any).chatReaction.findUnique({
      where: {
        messageId_customerId_emoji: {
          messageId,
          customerId: customer.id,
          emoji: reactionEmoji,
        }
      }
    });

    if (existing) {
      await (prisma as any).chatReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      await (prisma as any).chatReaction.create({
        data: {
          messageId,
          customerId: customer.id,
          emoji: reactionEmoji,
        }
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('Chat Reaction Error:', error);
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}
