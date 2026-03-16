ALTER TABLE "StudentProfile"
ADD COLUMN IF NOT EXISTS "interestTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "StudentProfile"
SET "interestTags" = ARRAY[]::TEXT[]
WHERE "interestTags" IS NULL;

ALTER TABLE "StudentProfile"
ALTER COLUMN "interestTags" SET NOT NULL;
