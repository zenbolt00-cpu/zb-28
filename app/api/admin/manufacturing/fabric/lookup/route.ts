import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/** Barcode / SKU scan — exact match on SKU (case-insensitive) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("q")?.trim();
    if (!raw) {
      return NextResponse.json({ error: "Missing q" }, { status: 400 });
    }

    const fabric = await prisma.mfgFabric.findFirst({
      where: {
        OR: [{ sku: raw }, { sku: raw.toUpperCase() }, { sku: raw.toLowerCase() }],
      },
    });

    if (!fabric) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(fabric);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
