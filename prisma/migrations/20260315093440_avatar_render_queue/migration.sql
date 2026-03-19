-- CreateEnum
CREATE TYPE "CheckinMethod" AS ENUM ('QR', 'FACE_ID');

-- CreateEnum
CREATE TYPE "AvatarRenderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "method" "CheckinMethod" NOT NULL DEFAULT 'QR';

-- CreateTable
CREATE TABLE "AvatarRenderJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarClass" "AvatarClass" NOT NULL,
    "avatarBodyStage" INTEGER NOT NULL,
    "status" "AvatarRenderStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarRenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarRenderMetric" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "totalMs" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarRenderMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvatarRenderJob_userId_key" ON "AvatarRenderJob"("userId");

-- CreateIndex
CREATE INDEX "AvatarRenderJob_status_createdAt_idx" ON "AvatarRenderJob"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarRenderMetric_day_key" ON "AvatarRenderMetric"("day");
