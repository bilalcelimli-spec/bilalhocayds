DO $$ BEGIN
    CREATE TYPE "DailyContentModule" AS ENUM ('VOCABULARY', 'READING', 'GRAMMAR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "StudentDailyContent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "moduleKey" "DailyContentModule" NOT NULL,
    "contentJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentDailyContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentDailyContent_userId_dayKey_moduleKey_key" ON "StudentDailyContent"("userId", "dayKey", "moduleKey");
CREATE INDEX IF NOT EXISTS "StudentDailyContent_userId_dayKey_idx" ON "StudentDailyContent"("userId", "dayKey");

DO $$ BEGIN
    ALTER TABLE "StudentDailyContent"
    ADD CONSTRAINT "StudentDailyContent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;