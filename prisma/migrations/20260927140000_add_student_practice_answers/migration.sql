-- CreateTable
CREATE TABLE "StudentPracticeAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleKey" "DailyContentModule" NOT NULL,
    "dayKey" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentPracticeAnswer_userId_moduleKey_dayKey_itemKey_key" ON "StudentPracticeAnswer"("userId", "moduleKey", "dayKey", "itemKey");

-- CreateIndex
CREATE INDEX "StudentPracticeAnswer_userId_answeredAt_idx" ON "StudentPracticeAnswer"("userId", "answeredAt");

-- AddForeignKey
ALTER TABLE "StudentPracticeAnswer" ADD CONSTRAINT "StudentPracticeAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
