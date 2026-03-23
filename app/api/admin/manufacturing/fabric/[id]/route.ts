import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getManufacturingActorName } from "@/lib/manufacturing/admin-actor";
import { logMfgAudit } from "@/lib/manufacturing/audit";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const fabric = await prisma.mfgFabric.findUnique({ where: { id } });
    if (!fabric) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(fabric);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const existing = await prisma.mfgFabric.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const actor = await getManufacturingActorName();
    const skuNext =
      typeof body.sku === "string" && body.sku.trim()
        ? body.sku.trim().toUpperCase()
        : undefined;
    if (skuNext && skuNext !== existing.sku) {
      const taken = await prisma.mfgFabric.findFirst({
        where: { sku: skuNext, NOT: { id } },
      });
      if (taken) {
        return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
      }
    }

    const fabric = await prisma.mfgFabric.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name.trim() : undefined,
        sku: skuNext,
        costPerMeter:
          body.costPerMeter !== undefined ? Number(body.costPerMeter) : undefined,
        weightValue:
          body.weightValue !== undefined ? Number(body.weightValue) : undefined,
        weightUnit: body.weightUnit === "g" ? "g" : body.weightUnit === "kg" ? "kg" : undefined,
        totalMeters:
          body.totalMeters !== undefined ? Number(body.totalMeters) : undefined,
        status:
          body.status === "INACTIVE"
            ? "INACTIVE"
            : body.status === "ACTIVE"
              ? "ACTIVE"
              : undefined,
        ...(body.lowStockMetersThreshold !== undefined
          ? {
              lowStockMetersThreshold:
                body.lowStockMetersThreshold === null || body.lowStockMetersThreshold === ""
                  ? null
                  : (() => {
                      const x = Number(body.lowStockMetersThreshold);
                      return Number.isFinite(x) && x >= 0 ? x : null;
                    })(),
            }
          : {}),
      },
    });

    const isScan = body.source === "scan";
    await logMfgAudit("MfgFabric", id, isScan ? "SCAN_UPDATE" : "UPDATE", actor, {
      before: {
        sku: existing.sku,
        costPerMeter: existing.costPerMeter,
        totalMeters: existing.totalMeters,
        weightValue: existing.weightValue,
      },
      after: {
        sku: fabric.sku,
        costPerMeter: fabric.costPerMeter,
        totalMeters: fabric.totalMeters,
        weightValue: fabric.weightValue,
      },
    });

    return NextResponse.json({ success: true, fabric });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const n = await prisma.mfgFabricMovement.count({ where: { fabricId: id } });
    if (n > 0) {
      return NextResponse.json(
        { error: "Cannot delete fabric with ledger movements. Set status to Inactive instead." },
        { status: 400 }
      );
    }
    await prisma.mfgFabric.delete({ where: { id } });
    const actor = await getManufacturingActorName();
    await logMfgAudit("MfgFabric", id, "DELETE", actor, {});
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
