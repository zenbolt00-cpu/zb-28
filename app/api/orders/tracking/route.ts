import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get("id");
    
    if (!trackingId) {
      return NextResponse.json({ error: "Tracking ID required" }, { status: 400 });
    }

    const shop = await prisma.shop.findFirst();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Mocking tracking fetch from Delhivery/Shiprocket
    // In production, you would use:
    // const res = await fetch(`https://track.delhivery.com/api/v1/packages/json/?waybill=${trackingId}`, {
    //   headers: { "Authorization": `Token ${shop.delhiveryApiKey}` }
    // });
    
    // Mock Response
    const mockTracking = {
      trackingId,
      status: "In Transit",
      location: "New Delhi Hub",
      lastUpdate: new Date().toISOString(),
      activities: [
        { time: new Date().toISOString(), location: "New Delhi Hub", status: "Arrived at Hub" },
        { time: new Date(Date.now() - 86400000).toISOString(), location: "Mumbai Facility", status: "Dispatched" }
      ]
    };

    return NextResponse.json(mockTracking);
  } catch (error: any) {
    console.error("Tracking Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
