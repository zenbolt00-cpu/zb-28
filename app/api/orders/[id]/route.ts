import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: {
          include: {
            product: true
          }
        }, 
        shipments: true,
        customer: true
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check: Ensure the order belongs to the requester
    const customer = await prisma.customer.findFirst({
        where: {
            OR: [
                { email: session.user.email || "" },
                { id: (session.user as any).id || "" }
            ]
        }
    });

    if (!customer || order.customerId !== customer.id) {
       return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Fetch Single Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
