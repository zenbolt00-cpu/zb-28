import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    // Get the first shop settings for Razorpay keys
    const shop = await prisma.shop.findFirst();

    if (!shop || !shop.razorpayKeyId || !shop.razorpayKeySecret) {
      return NextResponse.json(
        { error: "Razorpay is not configured for this shop" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: shop.razorpayKeyId,
      key_secret: shop.razorpayKeySecret,
    });

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      keyId: shop.razorpayKeyId,
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
