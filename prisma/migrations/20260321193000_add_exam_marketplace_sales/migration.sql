ALTER TABLE "ExamModule"
ADD COLUMN IF NOT EXISTS "marketplaceTitle" TEXT,
ADD COLUMN IF NOT EXISTS "marketplaceDescription" TEXT,
ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "isForSale" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ExamPurchase" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "LiveClassPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paytr',
    "providerMessage" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExamPurchase_referenceId_key" ON "ExamPurchase"("referenceId");
CREATE INDEX IF NOT EXISTS "ExamPurchase_examModuleId_idx" ON "ExamPurchase"("examModuleId");
CREATE INDEX IF NOT EXISTS "ExamPurchase_status_idx" ON "ExamPurchase"("status");
CREATE INDEX IF NOT EXISTS "ExamPurchase_paidAt_idx" ON "ExamPurchase"("paidAt");

DO $$ BEGIN
    ALTER TABLE "ExamPurchase"
    ADD CONSTRAINT "ExamPurchase_examModuleId_fkey"
    FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ExamPurchase"
    ADD CONSTRAINT "ExamPurchase_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;