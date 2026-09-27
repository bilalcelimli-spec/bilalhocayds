-- CreateEnum
CREATE TYPE "LiveClassType" AS ENUM ('GROUP', 'ONE_ON_ONE', 'WEBINAR');

-- CreateEnum
CREATE TYPE "LiveClassRoomProvider" AS ENUM ('EXTERNAL', 'LIVEKIT');

-- CreateEnum
CREATE TYPE "LiveClassStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'tr',
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
ADD COLUMN "country" TEXT;

-- AlterTable
ALTER TABLE "LiveClass"
ADD COLUMN "type" "LiveClassType" NOT NULL DEFAULT 'GROUP',
ADD COLUMN "roomProvider" "LiveClassRoomProvider" NOT NULL DEFAULT 'EXTERNAL',
ADD COLUMN "roomName" TEXT,
ADD COLUMN "status" "LiveClassStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN "capacity" INTEGER,
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "cefrLevel" TEXT,
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "endedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "LiveClass_roomName_key" ON "LiveClass"("roomName");

-- CreateTable
CREATE TABLE "LiveClassAttendance" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveClassAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveClassAttendance_liveClassId_idx" ON "LiveClassAttendance"("liveClassId");

-- CreateIndex
CREATE INDEX "LiveClassAttendance_userId_idx" ON "LiveClassAttendance"("userId");

-- CreateIndex
CREATE INDEX "LiveClassAttendance_liveClassId_userId_leftAt_idx" ON "LiveClassAttendance"("liveClassId", "userId", "leftAt");

-- AddForeignKey
ALTER TABLE "LiveClassAttendance" ADD CONSTRAINT "LiveClassAttendance_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "LiveClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassAttendance" ADD CONSTRAINT "LiveClassAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
