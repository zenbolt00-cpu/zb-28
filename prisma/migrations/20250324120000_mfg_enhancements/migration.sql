-- Manufacturing module enhancements (isolated)

ALTER TABLE "MfgFabric" ADD COLUMN IF NOT EXISTS "lowStockMetersThreshold" DOUBLE PRECISION;

ALTER TABLE "MfgProductionBatch" ADD COLUMN IF NOT EXISTS "fabricId" TEXT;
ALTER TABLE "MfgProductionBatch" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "MfgProductionBatch" ADD COLUMN IF NOT EXISTS "estimatedCostPerUnit" DOUBLE PRECISION;

ALTER TABLE "MfgMiscExpense" ADD COLUMN IF NOT EXISTS "expenseType" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "MfgMiscExpense" ALTER COLUMN "batchId" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "MfgBatchNote" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MfgBatchNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MfgBatchNote_batchId_createdAt_idx" ON "MfgBatchNote"("batchId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MfgProductionBatch_fabricId_fkey'
  ) THEN
    ALTER TABLE "MfgProductionBatch"
      ADD CONSTRAINT "MfgProductionBatch_fabricId_fkey"
      FOREIGN KEY ("fabricId") REFERENCES "MfgFabric"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MfgMiscExpense_batchId_fkey'
  ) THEN
    ALTER TABLE "MfgMiscExpense" DROP CONSTRAINT "MfgMiscExpense_batchId_fkey";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MfgMiscExpense_batchId_fkey'
  ) THEN
    ALTER TABLE "MfgMiscExpense"
      ADD CONSTRAINT "MfgMiscExpense_batchId_fkey"
      FOREIGN KEY ("batchId") REFERENCES "MfgProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "MfgBatchNote" DROP CONSTRAINT IF EXISTS "MfgBatchNote_batchId_fkey";
ALTER TABLE "MfgBatchNote"
  ADD CONSTRAINT "MfgBatchNote_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "MfgProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
