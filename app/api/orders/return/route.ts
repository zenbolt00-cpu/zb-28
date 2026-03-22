import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { orderId, productId, customerId, reason } = await req.json();

    if (!orderId || !productId || !customerId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const returnRequest = await prisma.return.create({
      data: {
        orderId,
        productId,
        customerId,
        reason,
        status: "REQUESTED",
      },
    });

    return NextResponse.json({ returnRequest });
  } catch (error: any) {
    console.error("Order Return API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
