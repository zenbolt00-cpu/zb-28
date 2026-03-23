import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getManufacturingActorName } from "@/lib/manufacturing/admin-actor";
import { logMfgAudit } from "@/lib/manufacturing/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const batch = await prisma.mfgProductionBatch.findUnique({ where: { id } });
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const actor = await getManufacturingActorName();
    const note = await prisma.mfgBatchNote.create({
      data: {
        batchId: id,
        content,
        createdByName: actor,
      },
    });

    await logMfgAudit("MfgProductionBatch", id, "NOTE_ADDED", actor, { noteId: note.id });

    return NextResponse.json({ success: true, note });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
