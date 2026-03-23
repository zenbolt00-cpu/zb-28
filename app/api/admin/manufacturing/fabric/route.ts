import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { suggestFabricSku } from "@/lib/manufacturing/sku";
import { getManufacturingActorName } from "@/lib/manufacturing/admin-actor";
import { logMfgAudit } from "@/lib/manufacturing/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const fabrics = await prisma.mfgFabric.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(fabrics);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      sku: skuIn,
      costPerMeter,
      weightValue,
      weightUnit,
      totalMeters,
      status,
      lowStockMetersThreshold,
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Fabric name is required" }, { status: 400 });
    }

    const actor = await getManufacturingActorName();
    let sku = typeof skuIn === "string" && skuIn.trim() ? skuIn.trim().toUpperCase() : "";
    if (!sku) {
      for (let i = 0; i < 32; i++) {
        const candidate = suggestFabricSku(name);
        const exists = await prisma.mfgFabric.findUnique({ where: { sku: candidate } });
        if (!exists) {
          sku = candidate;
          break;
        }
      }
      if (!sku) {
        return NextResponse.json({ error: "Could not allocate unique SKU" }, { status: 500 });
      }
    } else {
      const taken = await prisma.mfgFabric.findUnique({ where: { sku } });
      if (taken) {
        return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
      }
    }

    const wu = weightUnit === "g" ? "g" : "kg";
    const low =
      lowStockMetersThreshold !== undefined && lowStockMetersThreshold !== ""
        ? Number(lowStockMetersThreshold)
        : null;

    const fabric = await prisma.mfgFabric.create({
      data: {
        sku,
        name: name.trim(),
        costPerMeter: Number(costPerMeter) || 0,
        weightValue: Number(weightValue) || 0,
        weightUnit: wu,
        totalMeters: Number(totalMeters) || 0,
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        lowStockMetersThreshold:
          low !== null && Number.isFinite(low) && low >= 0 ? low : null,
      },
    });

    await logMfgAudit("MfgFabric", fabric.id, "CREATE", actor, {
      sku: fabric.sku,
      name: fabric.name,
    });

    return NextResponse.json({ success: true, fabric });
  } catch (e: any) {
    if (e?.code === "P2002") {
      const t = e?.meta?.target;
      const skuField = Array.isArray(t) ? t.includes("sku") : String(t || "").includes("sku");
      if (skuField) {
        return NextResponse.json(
          {
            error:
              "SKU already in use — click Generate in the form or clear the SKU field to auto-assign.",
          },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
