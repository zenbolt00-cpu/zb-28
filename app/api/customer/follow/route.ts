import { NextResponse } from 'next/server';
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";

export async function POST(req: Request) {
  try {
    const session = await getServerSession() as any;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetId, action } = await req.json();

    if (!targetId || !['follow', 'unfollow'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get current customer
    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.id === targetId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    if (action === 'follow') {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: customer.id,
            followingId: targetId
          }
        },
        create: {
          followerId: customer.id,
          followingId: targetId
        },
        update: {}
      });
    } else {
      await prisma.follow.deleteMany({
        where: {
          followerId: customer.id,
          followingId: targetId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
