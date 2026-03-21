ALTER TABLE "Plan"
ADD COLUMN IF NOT EXISTS "includesExam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isStandaloneExamProduct" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ExamModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "cefrLevel" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "questionCount" INTEGER NOT NULL DEFAULT 20,
    "description" TEXT,
    "instructions" TEXT,
    "contentJson" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExamModule_slug_key" ON "ExamModule"("slug");
CREATE INDEX IF NOT EXISTS "ExamModule_examType_idx" ON "ExamModule"("examType");
CREATE INDEX IF NOT EXISTS "ExamModule_isPublished_idx" ON "ExamModule"("isPublished");