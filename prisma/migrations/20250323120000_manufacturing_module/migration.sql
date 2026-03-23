-- Manufacturing module tables (isolated from core commerce models)

CREATE TABLE "MfgFabric" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "costPerMeter" DOUBLE PRECISION NOT NULL,
    "weightValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightUnit" TEXT NOT NULL DEFAULT 'kg',
    "totalMeters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfgFabric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MfgFabric_sku_key" ON "MfgFabric"("sku");

CREATE TABLE "MfgProductionBatch" (
    "id" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "currentStage" TEXT NOT NULL,
    "washCostTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfgProductionBatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MfgProductionBatch_batchCode_key" ON "MfgProductionBatch"("batchCode");

CREATE TABLE "MfgFabricMovement" (
    "id" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "rateAtMovement" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdByName" TEXT NOT NULL DEFAULT 'Admin',
    "correctsMovementId" TEXT,
    "productionBatchId" TEXT,
    "balanceMetersAfter" DOUBLE PRECISION,
    "balanceWeightAfter" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfgFabricMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MfgFabricMovement_fabricId_occurredAt_idx" ON "MfgFabricMovement"("fabricId", "occurredAt");
CREATE INDEX "MfgFabricMovement_productionBatchId_idx" ON "MfgFabricMovement"("productionBatchId");

ALTER TABLE "MfgFabricMovement" ADD CONSTRAINT "MfgFabricMovement_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "MfgFabric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfgFabricMovement" ADD CONSTRAINT "MfgFabricMovement_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "MfgProductionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MfgProductionStageLog" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "payload" JSONB NOT NULL,
    "costAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfgProductionStageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MfgProductionStageLog_batchId_createdAt_idx" ON "MfgProductionStageLog"("batchId", "createdAt");

ALTER TABLE "MfgProductionStageLog" ADD CONSTRAINT "MfgProductionStageLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MfgProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MfgMiscExpense" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfgMiscExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MfgMiscExpense_batchId_idx" ON "MfgMiscExpense"("batchId");

ALTER TABLE "MfgMiscExpense" ADD CONSTRAINT "MfgMiscExpense_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MfgProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MfgAuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "actorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfgAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MfgAuditLog_entityType_entityId_idx" ON "MfgAuditLog"("entityType", "entityId");
CREATE INDEX "MfgAuditLog_createdAt_idx" ON "MfgAuditLog"("createdAt");
