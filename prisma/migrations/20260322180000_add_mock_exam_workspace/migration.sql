CREATE TYPE "ExamAccessType" AS ENUM ('FREE', 'PREMIUM', 'PLAN_INCLUDED');
CREATE TYPE "ExamPublicationStatus" AS ENUM ('DRAFT', 'PARSING', 'REVIEW', 'READY', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ExamTakingMode" AS ENUM ('ONE_BY_ONE', 'SECTION_BASED', 'OMR_FOCUSED');
CREATE TYPE "ExamSectionType" AS ENUM ('VOCABULARY', 'GRAMMAR', 'CLOZE_TEST', 'SENTENCE_COMPLETION', 'TRANSLATION_EN_TO_TR', 'TRANSLATION_TR_TO_EN', 'PARAGRAPH_COMPLETION', 'READING_COMPREHENSION', 'DIALOGUE', 'CLOSEST_MEANING', 'OTHER');
CREATE TYPE "ParseJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'NEEDS_REVIEW', 'COMPLETED', 'FAILED');
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'VERIFIED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ExplanationSourceType" AS ENUM ('MANUAL', 'AI', 'HYBRID');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "ReviewBookingStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "ReviewPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

ALTER TABLE "ExamModule"
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "sourceLabel" TEXT,
ADD COLUMN     "examSeries" TEXT,
ADD COLUMN     "yearLabel" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "estimatedDifficulty" TEXT,
ADD COLUMN     "targetStudentLevel" TEXT,
ADD COLUMN     "accessType" "ExamAccessType" NOT NULL DEFAULT 'PREMIUM',
ADD COLUMN     "publicationStatus" "ExamPublicationStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "aiExplanationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lessonReviewPrice" DOUBLE PRECISION,
ADD COLUMN     "lessonCurrency" TEXT NOT NULL DEFAULT 'TRY',
ADD COLUMN     "bookingAvailabilityJson" JSONB,
ADD COLUMN     "retakeRulesJson" JSONB,
ADD COLUMN     "scoreVisibilityRulesJson" JSONB,
ADD COLUMN     "explanationVisibilityJson" JSONB,
ADD COLUMN     "randomizeQuestionOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showTimeWarnings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoSubmitOnTimeout" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowPause" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "takingMode" "ExamTakingMode" NOT NULL DEFAULT 'OMR_FOCUSED',
ADD COLUMN     "pdfOriginalAssetId" TEXT,
ADD COLUMN     "activeVersionId" TEXT;

CREATE TABLE "ExamVersion" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT,
    "sourcePdfAssetId" TEXT,
    "parseJobStatus" "ParseJobStatus" NOT NULL DEFAULT 'QUEUED',
    "parseConfidence" DOUBLE PRECISION,
    "parsedSnapshotJson" JSONB,
    "adminNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAsset" (
    "id" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "checksum" TEXT,
    "pageCount" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamParseJob" (
    "id" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "status" "ParseJobStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "rawOutputJson" JSONB,
    "lowConfidenceCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamParseJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamSection" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "sectionType" "ExamSectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "questionStartNumber" INTEGER,
    "questionEndNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPassageGroup" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT,
    "passageText" TEXT,
    "imageAssetId" TEXT,
    "sourcePageNumber" INTEGER,
    "sourceBoundsJson" JSONB,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamPassageGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "passageGroupId" TEXT,
    "questionNumber" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "sectionType" "ExamSectionType" NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "optionE" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanationSourceType" "ExplanationSourceType" NOT NULL DEFAULT 'AI',
    "manualExplanation" TEXT,
    "imageAssetId" TEXT,
    "sourcePageNumber" INTEGER,
    "sourceBoundsJson" JSONB,
    "parseConfidence" DOUBLE PRECISION,
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "topicTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficultyLabel" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "durationSecondsUsed" INTEGER,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "blankCount" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "netScore" DOUBLE PRECISION,
    "accuracyPercentage" DOUBLE PRECISION,
    "resultLockedAt" TIMESTAMP(3),
    "scoreSummaryJson" JSONB,
    "sectionPerformanceJson" JSONB,
    "strongestSection" TEXT,
    "weakestSection" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT,
    "isFlaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "isCorrect" BOOLEAN,
    "firstAnsweredAt" TIMESTAMP(3),
    "lastAnsweredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAttemptAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAttemptAnswerEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousAnswer" TEXT,
    "nextAnswer" TEXT,
    "previousFlagState" BOOLEAN,
    "nextFlagState" BOOLEAN,
    "clientTimestamp" TIMESTAMP(3),
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,

    CONSTRAINT "ExamAttemptAnswerEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamQuestionExplanation" (
    "id" TEXT NOT NULL,
    "examQuestionId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'tr',
    "sourceType" "ExplanationSourceType" NOT NULL DEFAULT 'AI',
    "promptVersion" TEXT,
    "contentJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "generatedAt" TIMESTAMP(3),
    "editedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamQuestionExplanation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamReviewBooking" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT,
    "status" "ReviewBookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "priceAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "selectedQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bookingScope" TEXT NOT NULL DEFAULT 'FULL_WRONG_SET',
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "lessonNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamReviewBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamReviewPayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "status" "ReviewPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "providerMessage" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAmount" DOUBLE PRECISION,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamReviewPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPricingRule" (
    "id" TEXT NOT NULL,
    "examModuleId" TEXT,
    "ruleType" TEXT NOT NULL,
    "label" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "userSegment" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamPricingRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamVersion_examModuleId_versionNumber_key" ON "ExamVersion"("examModuleId", "versionNumber");
CREATE INDEX "ExamVersion_examModuleId_isActive_idx" ON "ExamVersion"("examModuleId", "isActive");
CREATE INDEX "ExamAsset_examVersionId_assetType_idx" ON "ExamAsset"("examVersionId", "assetType");
CREATE INDEX "ExamParseJob_examVersionId_status_idx" ON "ExamParseJob"("examVersionId", "status");
CREATE INDEX "ExamSection_examModuleId_displayOrder_idx" ON "ExamSection"("examModuleId", "displayOrder");
CREATE INDEX "ExamSection_examVersionId_displayOrder_idx" ON "ExamSection"("examVersionId", "displayOrder");
CREATE INDEX "ExamPassageGroup_examVersionId_sectionId_displayOrder_idx" ON "ExamPassageGroup"("examVersionId", "sectionId", "displayOrder");
CREATE UNIQUE INDEX "ExamQuestion_examVersionId_questionNumber_key" ON "ExamQuestion"("examVersionId", "questionNumber");
CREATE INDEX "ExamQuestion_examModuleId_displayOrder_idx" ON "ExamQuestion"("examModuleId", "displayOrder");
CREATE INDEX "ExamQuestion_examVersionId_sectionId_displayOrder_idx" ON "ExamQuestion"("examVersionId", "sectionId", "displayOrder");
CREATE INDEX "ExamQuestion_passageGroupId_idx" ON "ExamQuestion"("passageGroupId");
CREATE INDEX "ExamAttempt_studentId_startedAt_idx" ON "ExamAttempt"("studentId", "startedAt");
CREATE INDEX "ExamAttempt_examModuleId_studentId_idx" ON "ExamAttempt"("examModuleId", "studentId");
CREATE INDEX "ExamAttempt_status_expiresAt_idx" ON "ExamAttempt"("status", "expiresAt");
CREATE UNIQUE INDEX "ExamAttemptAnswer_attemptId_questionId_key" ON "ExamAttemptAnswer"("attemptId", "questionId");
CREATE INDEX "ExamAttemptAnswer_attemptId_idx" ON "ExamAttemptAnswer"("attemptId");
CREATE INDEX "ExamAttemptAnswer_questionId_idx" ON "ExamAttemptAnswer"("questionId");
CREATE INDEX "ExamAttemptAnswerEvent_attemptId_serverTimestamp_idx" ON "ExamAttemptAnswerEvent"("attemptId", "serverTimestamp");
CREATE UNIQUE INDEX "ExamQuestionExplanation_examQuestionId_languageCode_promptVersion_key" ON "ExamQuestionExplanation"("examQuestionId", "languageCode", "promptVersion");
CREATE INDEX "ExamQuestionExplanation_examQuestionId_isActive_idx" ON "ExamQuestionExplanation"("examQuestionId", "isActive");
CREATE INDEX "ExamReviewBooking_studentId_status_idx" ON "ExamReviewBooking"("studentId", "status");
CREATE INDEX "ExamReviewBooking_teacherId_scheduledStartAt_idx" ON "ExamReviewBooking"("teacherId", "scheduledStartAt");
CREATE INDEX "ExamReviewBooking_attemptId_idx" ON "ExamReviewBooking"("attemptId");
CREATE UNIQUE INDEX "ExamReviewPayment_providerPaymentId_key" ON "ExamReviewPayment"("providerPaymentId");
CREATE INDEX "ExamReviewPayment_bookingId_status_idx" ON "ExamReviewPayment"("bookingId", "status");
CREATE INDEX "ExamPricingRule_examModuleId_isActive_idx" ON "ExamPricingRule"("examModuleId", "isActive");
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

ALTER TABLE "ExamVersion" ADD CONSTRAINT "ExamVersion_examModuleId_fkey" FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAsset" ADD CONSTRAINT "ExamAsset_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "ExamVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamParseJob" ADD CONSTRAINT "ExamParseJob_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "ExamVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_examModuleId_fkey" FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "ExamVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPassageGroup" ADD CONSTRAINT "ExamPassageGroup_examModuleId_fkey" FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPassageGroup" ADD CONSTRAINT "ExamPassageGroup_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "ExamVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPassageGroup" ADD CONSTRAINT "ExamPassageGroup_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examModuleId_fkey" FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "ExamVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_passageGroupId_fkey" FOREIGN KEY ("passageGroupId") REFERENCES "ExamPassageGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examModuleId_fkey" FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "ExamVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttemptAnswer" ADD CONSTRAINT "ExamAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttemptAnswer" ADD CONSTRAINT "ExamAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttemptAnswerEvent" ADD CONSTRAINT "ExamAttemptAnswerEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamQuestionExplanation" ADD CONSTRAINT "ExamQuestionExplanation_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamReviewBooking" ADD CONSTRAINT "ExamReviewBooking_examModuleId_fkey" FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamReviewBooking" ADD CONSTRAINT "ExamReviewBooking_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamReviewBooking" ADD CONSTRAINT "ExamReviewBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamReviewBooking" ADD CONSTRAINT "ExamReviewBooking_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamReviewPayment" ADD CONSTRAINT "ExamReviewPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ExamReviewBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamReviewPayment" ADD CONSTRAINT "ExamReviewPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPricingRule" ADD CONSTRAINT "ExamPricingRule_examModuleId_fkey" FOREIGN KEY ("examModuleId") REFERENCES "ExamModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;