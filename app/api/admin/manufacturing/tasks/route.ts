import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getManufacturingActorName } from "@/lib/manufacturing/admin-actor";
import { logMfgAudit } from "@/lib/manufacturing/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const includeProduction = searchParams.get("includeProduction") === "true";

    // 1. Fetch manual tasks
    const manualTasks = await prisma.mfgTask.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        batch: {
          select: {
            id: true,
            batchCode: true,
            productName: true,
            currentStage: true,
          },
        },
      },
    });

    let combinedTasks = manualTasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      type: "MANUAL",
      batch: t.batch,
    }));

    // 2. If requested, fetch pending production batches as tasks
    if (includeProduction) {
      const pendingBatches = await prisma.mfgProductionBatch.findMany({
        where: {
          NOT: [
            { currentStage: "QC_PASSED" },
            { currentStage: "REJECTED_REWORK" },
          ],
        },
        orderBy: { updatedAt: "desc" },
      });

      const productionTasks = pendingBatches.map(b => ({
        id: `PROD-${b.id}`,
        title: `Production: ${b.productName} (${b.batchCode})`,
        description: `Currently at: ${b.currentStage}. Quantity: ${b.quantity}`,
        status: "PENDING",
        priority: "HIGH",
        dueDate: new Date(new Date(b.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from creation
        createdAt: b.createdAt,
        type: "PRODUCTION",
        batch: {
          id: b.id,
          batchCode: b.batchCode,
          productName: b.productName,
          currentStage: b.currentStage,
        },
      }));

      combinedTasks = [...combinedTasks, ...productionTasks];
      // Re-sort by priority and creation date
      combinedTasks.sort((a: any, b: any) => {
        const priorityScore: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        if (priorityScore[b.priority] !== priorityScore[a.priority]) {
          return priorityScore[b.priority] - priorityScore[a.priority];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return NextResponse.json(combinedTasks);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, priority, dueDate, batchId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const actor = await getManufacturingActorName();

    const task = await prisma.mfgTask.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        batchId: batchId || null,
        createdByName: actor,
      },
    });

    await logMfgAudit("MfgTask", task.id, "CREATE", actor, { title: task.title });

    return NextResponse.json({ success: true, task });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, title, description, priority, dueDate } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const actor = await getManufacturingActorName();

    const task = await prisma.mfgTask.update({
      where: { id },
      data: {
        ...(status ? { status, completedAt: status === "COMPLETED" ? new Date() : null } : {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(priority ? { priority } : {}),
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      },
    });

    await logMfgAudit("MfgTask", task.id, "UPDATE", actor, { status: task.status });

    return NextResponse.json({ success: true, task });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const actor = await getManufacturingActorName();

    await prisma.mfgTask.delete({
      where: { id },
    });

    await logMfgAudit("MfgTask", id, "DELETE", actor, {});

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
