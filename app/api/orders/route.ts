import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findFirst({
        where: {
            OR: [
                { email: session.user.email || "" },
                { id: (session.user as any).id || "" }
            ]
        }
    });

    if (!customer) {
        return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: true, shipments: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
