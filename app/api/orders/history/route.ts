import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!phone && !email) {
      return NextResponse.json({ error: "Phone or Email required" }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          phone ? { phone: phone } : undefined,
          email ? { email: email } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        orders: {
          include: {
            items: true,
            shipments: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: customer.orders });
  } catch (error: any) {
    console.error("Order History API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
