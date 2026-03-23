import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getManufacturingActorName } from "@/lib/manufacturing/admin-actor";
import { logMfgAudit } from "@/lib/manufacturing/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId") || undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter =
      from || to
        ? {
            expenseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const rows = await prisma.mfgMiscExpense.findMany({
      where: {
        ...(batchId ? { batchId } : {}),
        ...dateFilter,
      },
      orderBy: { expenseDate: "desc" },
      include: { batch: { select: { batchCode: true, productName: true } } },
    });
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const batchId =
      typeof body.batchId === "string" && body.batchId.trim() ? body.batchId.trim() : null;
    const amount = Number(body.amount);
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const expenseType =
      typeof body.expenseType === "string" && body.expenseType.trim()
        ? body.expenseType.trim()
        : "OTHER";
    const expenseDate = body.expenseDate ? new Date(body.expenseDate) : new Date();

    if (Number.isNaN(amount) || !description) {
      return NextResponse.json(
        { error: "amount and description are required" },
        { status: 400 }
      );
    }

    if (batchId) {
      const batch = await prisma.mfgProductionBatch.findUnique({ where: { id: batchId } });
      if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const actor = await getManufacturingActorName();
    const row = await prisma.mfgMiscExpense.create({
      data: {
        batchId,
        amount,
        description,
        expenseType,
        expenseDate,
        createdByName: actor,
      },
    });

    await logMfgAudit("MfgMiscExpense", row.id, "CREATE", actor, {
      batchId,
      amount,
      expenseType,
    });

    return NextResponse.json({ success: true, expense: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
