DO $$ BEGIN
    CREATE TYPE "ContentSourceType" AS ENUM ('TEXT', 'WEB', 'PDF', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContentGenerationStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ContentSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "ContentSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "mimeType" TEXT,
    "rawText" TEXT,
    "extractedText" TEXT NOT NULL,
    "styleNotes" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "metadataJson" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContentGenerationRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContentGenerationStatus" NOT NULL DEFAULT 'COMPLETED',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "itemType" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "sourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sourceSnapshotJson" JSONB,
    "styleAnalysis" TEXT,
    "instructions" TEXT,
    "generatedItemsJson" JSONB,
    "generatedText" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentGenerationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentSource_createdAt_idx" ON "ContentSource"("createdAt");
CREATE INDEX IF NOT EXISTS "ContentSource_sourceType_idx" ON "ContentSource"("sourceType");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_createdAt_idx" ON "ContentGenerationRun"("createdAt");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_status_idx" ON "ContentGenerationRun"("status");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_isApproved_idx" ON "ContentGenerationRun"("isApproved");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_isPublished_idx" ON "ContentGenerationRun"("isPublished");