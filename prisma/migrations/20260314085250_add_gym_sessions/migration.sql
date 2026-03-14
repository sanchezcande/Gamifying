-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('WEIGHTS', 'CARDIO', 'FUNCTIONAL', 'CALISTHENICS', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pushToken" TEXT;

-- CreateTable
CREATE TABLE "GymSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "workoutType" "WorkoutType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "spotsAvailable" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionJoin" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionJoin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymSession_gymId_scheduledAt_idx" ON "GymSession"("gymId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionJoin_sessionId_userId_key" ON "SessionJoin"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "GymSession" ADD CONSTRAINT "GymSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymSession" ADD CONSTRAINT "GymSession_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionJoin" ADD CONSTRAINT "SessionJoin_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GymSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionJoin" ADD CONSTRAINT "SessionJoin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
