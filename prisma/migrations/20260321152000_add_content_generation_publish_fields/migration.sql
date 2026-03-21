ALTER TABLE "ContentGenerationRun"
ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "publishedById" TEXT;

CREATE INDEX IF NOT EXISTS "ContentGenerationRun_isApproved_idx" ON "ContentGenerationRun"("isApproved");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_isPublished_idx" ON "ContentGenerationRun"("isPublished");