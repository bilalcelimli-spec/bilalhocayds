-- Reading modülü tabloları şemada vardı ancak hiçbir migration bunları oluşturmuyordu
-- (muhtemelen production'da `prisma db push` ile oluşturuldu). Bu migration idempotenttir:
-- tablolar/enum'lar/index'ler/foreign key'ler zaten varsa atlanır, yoksa oluşturulur.
-- Ayrıca küçük şema sapmalarını giderir (updatedAt varsayılanları, kısaltılmış index adı).

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingSourceType" AS ENUM ('APPROVED_NEWS', 'EDUCATIONAL_ARTICLE', 'SCIENCE_TECH_HEALTH', 'MANUAL_UPLOAD', 'CURATED_DATABASE', 'PLATFORM_ORIGINAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingIngestionStatus" AS ENUM ('RECEIVED', 'SOURCE_VALIDATED', 'RAW_EXTRACTED', 'CLEANED', 'LINGUISTIC_ANALYZED', 'PEDAGOGICALLY_TRANSFORMED', 'ACTIVITY_GENERATED', 'QA_REVIEWED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingEditorialStatus" AS ENUM ('DRAFT', 'AI_GENERATED', 'ADMIN_REVIEWED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingPackageMode" AS ENUM ('DAILY_GUIDED', 'EXAM_TRAINING', 'YDT_YDS_EXPERT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingActivityType" AS ENUM ('COMPREHENSION', 'VOCABULARY', 'YDS_YDT_LOGIC', 'CONNECTOR_COHESION', 'FOLLOW_UP_ANALYSIS');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingQuestionType" AS ENUM ('MAIN_IDEA', 'DETAIL', 'INFERENCE', 'AUTHOR_ATTITUDE', 'PURPOSE', 'REFERENCE_WORD', 'TITLE_SELECTION', 'PARAGRAPH_FUNCTION', 'WORD_MEANING_IN_CONTEXT', 'SYNONYM_IN_CONTEXT', 'ANTONYM_RELEVANCE', 'COLLOCATION_SELECTION', 'WORD_FORM', 'CLOSEST_MEANING', 'PARAGRAPH_COMPLETION', 'SENTENCE_INSERTION', 'DISRUPTS_FLOW', 'CONNECTOR_SELECTION', 'DISCOURSE_RELATION', 'BEST_CONTINUATION', 'PARAPHRASE_RECOGNITION', 'SHORT_STRATEGY_REFLECTION');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingDifficultyBand" AS ENUM ('FOUNDATION', 'DEVELOPING', 'EXAM_READY', 'EXPERT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReadingAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "LiveClassPurchase" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SeoConfig" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApprovedReadingSourceDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sourceType" "ReadingSourceType" NOT NULL,
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "extractionStrategy" TEXT,
    "allowedTopicsJson" JSONB,
    "blockedPatternsJson" JSONB,
    "maxDailyPull" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovedReadingSourceDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingSourceDocument" (
    "id" TEXT NOT NULL,
    "sourceDomainId" TEXT,
    "sourceType" "ReadingSourceType" NOT NULL,
    "ingestionStatus" "ReadingIngestionStatus" NOT NULL DEFAULT 'RECEIVED',
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "externalId" TEXT,
    "rawHtml" TEXT,
    "rawText" TEXT,
    "extractedTitle" TEXT,
    "extractedBody" TEXT,
    "extractionMetaJson" JSONB,
    "contentHash" TEXT,
    "detectedLanguage" TEXT,
    "rejectionReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingPassageAsset" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "authoringMode" TEXT NOT NULL,
    "editorialStatus" "ReadingEditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "cleanedText" TEXT NOT NULL,
    "finalText" TEXT NOT NULL,
    "summary" TEXT,
    "topic" TEXT,
    "subtopic" TEXT,
    "targetExamJson" JSONB,
    "cefrEstimate" TEXT,
    "lexicalDensity" DOUBLE PRECISION,
    "sentenceComplexity" DOUBLE PRECISION,
    "connectorDensity" DOUBLE PRECISION,
    "wordCount" INTEGER NOT NULL,
    "paragraphCount" INTEGER NOT NULL,
    "suitabilityJson" JSONB,
    "safetyStatus" TEXT,
    "transformationNotesJson" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingPassageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingPackage" (
    "id" TEXT NOT NULL,
    "passageAssetId" TEXT NOT NULL,
    "packageDate" TIMESTAMP(3),
    "mode" "ReadingPackageMode" NOT NULL DEFAULT 'DAILY_GUIDED',
    "targetExam" TEXT NOT NULL,
    "targetLevel" TEXT,
    "personalizationProfileJson" JSONB,
    "headerJson" JSONB NOT NULL,
    "analyticsBlueprintJson" JSONB,
    "status" "ReadingEditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingActivity" (
    "id" TEXT NOT NULL,
    "readingPackageId" TEXT NOT NULL,
    "activityType" "ReadingActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingQuestion" (
    "id" TEXT NOT NULL,
    "readingActivityId" TEXT NOT NULL,
    "questionType" "ReadingQuestionType" NOT NULL,
    "relatedParagraphsJson" JSONB,
    "prompt" TEXT NOT NULL,
    "choicesJson" JSONB,
    "correctAnswerJson" JSONB NOT NULL,
    "distractorRationaleJson" JSONB,
    "explanationJson" JSONB,
    "evidenceMapJson" JSONB,
    "skillTag" TEXT NOT NULL,
    "difficulty" "ReadingDifficultyBand" NOT NULL DEFAULT 'DEVELOPING',
    "estimatedTimeSec" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingVocabularyTarget" (
    "id" TEXT NOT NULL,
    "readingPackageId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "lemma" TEXT,
    "partOfSpeech" TEXT,
    "definitionEn" TEXT,
    "meaningTr" TEXT,
    "exampleSentence" TEXT,
    "collocation" TEXT,
    "synonym" TEXT,
    "antonym" TEXT,
    "wordFamilyJson" JSONB,
    "memoryNote" TEXT,
    "difficulty" "ReadingDifficultyBand" NOT NULL DEFAULT 'DEVELOPING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingVocabularyTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StudentReadingAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readingPackageId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignmentReason" TEXT,
    "personalizationSnapshotJson" JSONB,
    "status" "ReadingAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentReadingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StudentReadingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readingPackageId" TEXT NOT NULL,
    "mode" "ReadingPackageMode" NOT NULL DEFAULT 'DAILY_GUIDED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalIncorrect" INTEGER NOT NULL DEFAULT 0,
    "totalBlank" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "totalTimeSec" INTEGER,
    "analyticsJson" JSONB,
    "recommendationJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentReadingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StudentReadingAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedChoiceId" TEXT,
    "typedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "timeSpentSec" INTEGER,
    "changedCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceLevel" INTEGER,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentReadingAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingQuestionReview" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "reviewType" TEXT NOT NULL,
    "note" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingQuestionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReadingSourcePerformance" (
    "id" TEXT NOT NULL,
    "sourceDomainId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "packagesPublished" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION,
    "avgAccuracy" DOUBLE PRECISION,
    "avgStudentRating" DOUBLE PRECISION,
    "flaggedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSourcePerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ApprovedReadingSourceDomain_domain_key" ON "ApprovedReadingSourceDomain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReadingSourceDocument_contentHash_key" ON "ReadingSourceDocument"("contentHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingSourceDocument_sourceDomainId_ingestionStatus_idx" ON "ReadingSourceDocument"("sourceDomainId", "ingestionStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingSourceDocument_sourceType_ingestionStatus_idx" ON "ReadingSourceDocument"("sourceType", "ingestionStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingPassageAsset_editorialStatus_publishedAt_idx" ON "ReadingPassageAsset"("editorialStatus", "publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingPassageAsset_topic_subtopic_idx" ON "ReadingPassageAsset"("topic", "subtopic");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingPackage_packageDate_mode_idx" ON "ReadingPackage"("packageDate", "mode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingPackage_targetExam_targetLevel_idx" ON "ReadingPackage"("targetExam", "targetLevel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingActivity_readingPackageId_displayOrder_idx" ON "ReadingActivity"("readingPackageId", "displayOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingQuestion_readingActivityId_idx" ON "ReadingQuestion"("readingActivityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingQuestion_questionType_skillTag_idx" ON "ReadingQuestion"("questionType", "skillTag");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingVocabularyTarget_readingPackageId_idx" ON "ReadingVocabularyTarget"("readingPackageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingVocabularyTarget_word_idx" ON "ReadingVocabularyTarget"("word");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StudentReadingAssignment_userId_assignedDate_idx" ON "StudentReadingAssignment"("userId", "assignedDate");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StudentReadingAssignment_userId_readingPackageId_key" ON "StudentReadingAssignment"("userId", "readingPackageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StudentReadingAttempt_userId_startedAt_idx" ON "StudentReadingAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StudentReadingAttempt_readingPackageId_idx" ON "StudentReadingAttempt"("readingPackageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StudentReadingAnswer_questionId_idx" ON "StudentReadingAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StudentReadingAnswer_attemptId_questionId_key" ON "StudentReadingAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingQuestionReview_questionId_reviewType_idx" ON "ReadingQuestionReview"("questionId", "reviewType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReadingSourcePerformance_periodKey_idx" ON "ReadingSourcePerformance"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReadingSourcePerformance_sourceDomainId_periodKey_key" ON "ReadingSourcePerformance"("sourceDomainId", "periodKey");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingSourceDocument" ADD CONSTRAINT "ReadingSourceDocument_sourceDomainId_fkey" FOREIGN KEY ("sourceDomainId") REFERENCES "ApprovedReadingSourceDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingPassageAsset" ADD CONSTRAINT "ReadingPassageAsset_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "ReadingSourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingPackage" ADD CONSTRAINT "ReadingPackage_passageAssetId_fkey" FOREIGN KEY ("passageAssetId") REFERENCES "ReadingPassageAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingActivity" ADD CONSTRAINT "ReadingActivity_readingPackageId_fkey" FOREIGN KEY ("readingPackageId") REFERENCES "ReadingPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingQuestion" ADD CONSTRAINT "ReadingQuestion_readingActivityId_fkey" FOREIGN KEY ("readingActivityId") REFERENCES "ReadingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingVocabularyTarget" ADD CONSTRAINT "ReadingVocabularyTarget_readingPackageId_fkey" FOREIGN KEY ("readingPackageId") REFERENCES "ReadingPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "StudentReadingAssignment" ADD CONSTRAINT "StudentReadingAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "StudentReadingAssignment" ADD CONSTRAINT "StudentReadingAssignment_readingPackageId_fkey" FOREIGN KEY ("readingPackageId") REFERENCES "ReadingPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "StudentReadingAttempt" ADD CONSTRAINT "StudentReadingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "StudentReadingAttempt" ADD CONSTRAINT "StudentReadingAttempt_readingPackageId_fkey" FOREIGN KEY ("readingPackageId") REFERENCES "ReadingPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "StudentReadingAnswer" ADD CONSTRAINT "StudentReadingAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "StudentReadingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "StudentReadingAnswer" ADD CONSTRAINT "StudentReadingAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ReadingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingQuestionReview" ADD CONSTRAINT "ReadingQuestionReview_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ReadingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ReadingSourcePerformance" ADD CONSTRAINT "ReadingSourcePerformance_sourceDomainId_fkey" FOREIGN KEY ("sourceDomainId") REFERENCES "ApprovedReadingSourceDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- RenameIndex
ALTER INDEX IF EXISTS "ExamQuestionExplanation_examQuestionId_languageCode_promptVersi" RENAME TO "ExamQuestionExplanation_examQuestionId_languageCode_promptV_key";


-- Şemaya eklenen mevcut index'ler: `db push` ile silinmiş olabilecekleri geri oluştur.
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_createdAt_idx" ON "ContentGenerationRun"("createdAt");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_status_idx" ON "ContentGenerationRun"("status");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_isApproved_idx" ON "ContentGenerationRun"("isApproved");
CREATE INDEX IF NOT EXISTS "ContentGenerationRun_isPublished_idx" ON "ContentGenerationRun"("isPublished");
CREATE INDEX IF NOT EXISTS "ContentSource_createdAt_idx" ON "ContentSource"("createdAt");
CREATE INDEX IF NOT EXISTS "ContentSource_sourceType_idx" ON "ContentSource"("sourceType");
CREATE INDEX IF NOT EXISTS "ExamModule_examType_idx" ON "ExamModule"("examType");
CREATE INDEX IF NOT EXISTS "ExamModule_isPublished_idx" ON "ExamModule"("isPublished");
CREATE INDEX IF NOT EXISTS "ExamPurchase_examModuleId_idx" ON "ExamPurchase"("examModuleId");
CREATE INDEX IF NOT EXISTS "ExamPurchase_status_idx" ON "ExamPurchase"("status");
CREATE INDEX IF NOT EXISTS "ExamPurchase_paidAt_idx" ON "ExamPurchase"("paidAt");
CREATE INDEX IF NOT EXISTS "LiveClassPurchase_liveClassId_idx" ON "LiveClassPurchase"("liveClassId");
CREATE INDEX IF NOT EXISTS "LiveClassPurchase_userId_idx" ON "LiveClassPurchase"("userId");
