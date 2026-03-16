-- DropIndex
DROP INDEX "LiveClassPurchase_liveClassId_idx";

-- DropIndex
DROP INDEX "LiveClassPurchase_userId_idx";

-- AlterTable
ALTER TABLE "LiveClassPurchase" ALTER COLUMN "updatedAt" DROP DEFAULT;
