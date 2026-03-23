import type { Prisma } from "@prisma/client";
import {
  movementDeltas,
  totalValueForMovement,
  type QtyUnit,
} from "@/lib/manufacturing/fabric-movement-math";

type Tx = Prisma.TransactionClient;

export type ExecuteMovementInput = {
  fabricId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  quantityUnit: QtyUnit;
  rateAtMovement: number;
  occurredAt: Date;
  remarks: string | null;
  productionBatchId: string | null;
  correctsMovementId: string | null;
  actor: string;
};

export async function executeFabricMovement(tx: Tx, input: ExecuteMovementInput) {
  const {
    fabricId,
    type,
    quantity: qty,
    quantityUnit: unit,
    rateAtMovement: rate,
    occurredAt: when,
    remarks,
    productionBatchId,
    correctsMovementId,
    actor,
  } = input;

  const totalValue =
    type === "ADJUSTMENT"
      ? Math.round(Math.abs(qty) * rate * 100) / 100
      : totalValueForMovement(qty, rate, unit);

  const fabric = await tx.mfgFabric.findUnique({ where: { id: fabricId } });
  if (!fabric) throw new Error("Fabric not found");

  const { deltaMeters, deltaWeightFabricUnit } = movementDeltas({
    type,
    quantity: qty,
    quantityUnit: unit,
    fabricWeightUnit: fabric.weightUnit,
  });

  let nextMeters = fabric.totalMeters + deltaMeters;
  let nextWeight = fabric.weightValue + deltaWeightFabricUnit;
  nextMeters = Math.max(0, nextMeters);
  nextWeight = Math.max(0, nextWeight);

  const row = await tx.mfgFabricMovement.create({
    data: {
      fabricId,
      occurredAt: when,
      type,
      quantity: qty,
      quantityUnit: unit,
      rateAtMovement: rate,
      totalValue,
      remarks,
      createdByName: actor,
      correctsMovementId,
      productionBatchId,
      balanceMetersAfter: nextMeters,
      balanceWeightAfter: nextWeight,
    },
  });

  await tx.mfgFabric.update({
    where: { id: fabricId },
    data: {
      totalMeters: nextMeters,
      weightValue: nextWeight,
    },
  });

  return { row, totalValue };
}
