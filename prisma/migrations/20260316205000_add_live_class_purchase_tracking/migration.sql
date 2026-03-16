DO $$ BEGIN
  CREATE TYPE "LiveClassPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "LiveClassPurchase" (
  "id" TEXT NOT NULL,
  "liveClassId" TEXT NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveClassPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LiveClassPurchase_referenceId_key" ON "LiveClassPurchase"("referenceId");
CREATE INDEX IF NOT EXISTS "LiveClassPurchase_liveClassId_idx" ON "LiveClassPurchase"("liveClassId");
CREATE INDEX IF NOT EXISTS "LiveClassPurchase_userId_idx" ON "LiveClassPurchase"("userId");

DO $$ BEGIN
  ALTER TABLE "LiveClassPurchase"
  ADD CONSTRAINT "LiveClassPurchase_liveClassId_fkey"
  FOREIGN KEY ("liveClassId") REFERENCES "LiveClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "LiveClassPurchase"
  ADD CONSTRAINT "LiveClassPurchase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
