import prisma from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function logMfgAudit(
  entityType: string,
  entityId: string,
  action: string,
  actorName: string,
  details?: Prisma.InputJsonValue
) {
  try {
    await prisma.mfgAuditLog.create({
      data: {
        entityType,
        entityId,
        action,
        actorName,
        details: details === undefined ? undefined : details,
      },
    });
  } catch {
    // non-fatal
  }
}
