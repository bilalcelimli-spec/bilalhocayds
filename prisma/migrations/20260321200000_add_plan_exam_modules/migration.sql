CREATE TABLE IF NOT EXISTS "PlanExamModule" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanExamModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlanExamModule_planId_examModuleId_key" ON "PlanExamModule"("planId", "examModuleId");
CREATE INDEX IF NOT EXISTS "PlanExamModule_planId_idx" ON "PlanExamModule"("planId");
CREATE INDEX IF NOT EXISTS "PlanExamModule_examModuleId_idx" ON "PlanExamModule"("examModuleId");

DO $$ BEGIN
    ALTER TABLE "PlanExamModule"
    ADD CONSTRAINT "PlanExamModule_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PlanExamModule"
    ADD CONSTRAINT "PlanExamModule_examModuleId_fkey"
    FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;