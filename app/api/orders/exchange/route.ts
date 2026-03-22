import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { orderId, originalProductId, newProductId, status } = await req.json();

    if (!orderId || !originalProductId || !newProductId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const exchangeRequest = await prisma.exchange.create({
      data: {
        orderId,
        originalProductId,
        newProductId,
        status: status || "REQUESTED",
      },
    });

    return NextResponse.json({ exchangeRequest });
  } catch (error: any) {
    console.error("Order Exchange API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
