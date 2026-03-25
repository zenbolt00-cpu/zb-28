import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getManufacturingActorName } from "@/lib/manufacturing/admin-actor";
import { logMfgAudit } from "@/lib/manufacturing/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vendors = await prisma.mfgVendor.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vendors);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, mobile, category } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const vendor = await prisma.mfgVendor.create({
      data: {
        name,
        address,
        mobile,
        category,
      },
    });

    const actor = await getManufacturingActorName();
    await logMfgAudit("MfgVendor", vendor.id, "CREATE", actor, { name, category });

    return NextResponse.json(vendor);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
