CREATE TABLE IF NOT EXISTS "StudentFeatureAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasReadingAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasGrammarAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasVocabAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasExamAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasLiveClassesAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasLiveRecordingsAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasContentLibraryAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasAIPlannerAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentFeatureAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentFeatureAccess_userId_key" ON "StudentFeatureAccess"("userId");

DO $$ BEGIN
    ALTER TABLE "StudentFeatureAccess"
    ADD CONSTRAINT "StudentFeatureAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "StudentFeatureExamAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentFeatureExamAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentFeatureExamAccess_userId_examModuleId_key" ON "StudentFeatureExamAccess"("userId", "examModuleId");
CREATE INDEX IF NOT EXISTS "StudentFeatureExamAccess_userId_idx" ON "StudentFeatureExamAccess"("userId");
CREATE INDEX IF NOT EXISTS "StudentFeatureExamAccess_examModuleId_idx" ON "StudentFeatureExamAccess"("examModuleId");

DO $$ BEGIN
    ALTER TABLE "StudentFeatureExamAccess"
    ADD CONSTRAINT "StudentFeatureExamAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "StudentFeatureExamAccess"
    ADD CONSTRAINT "StudentFeatureExamAccess_examModuleId_fkey"
    FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;