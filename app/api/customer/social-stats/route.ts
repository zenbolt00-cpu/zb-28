export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const session = await getServerSession() as any;
    const currentCustomerEmail = session?.user?.email;

    let currentCustomerId = null;
    if (currentCustomerEmail) {
      const currentCustomer = await prisma.customer.findFirst({
        where: { email: currentCustomerEmail }
      });
      currentCustomerId = currentCustomer?.id;
    }

    const [followersCount, followingCount, isFollowing] = await Promise.all([
      prisma.follow.count({ where: { followingId: customerId } }),
      prisma.follow.count({ where: { followerId: customerId } }),
      currentCustomerId 
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentCustomerId,
                followingId: customerId
              }
            }
          })
        : null
    ]);

    return NextResponse.json({
      followersCount,
      followingCount,
      isFollowing: !!isFollowing
    });
  } catch (error) {
    console.error('Social Stats API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
