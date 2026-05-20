-- CreateEnum
CREATE TYPE "WodScoreType" AS ENUM ('WEIGHT', 'TIME', 'REPS');

-- CreateTable
CREATE TABLE "GymFeedback" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wod" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "scoreType" "WodScoreType" NOT NULL DEFAULT 'WEIGHT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WodExercise" (
    "id" TEXT NOT NULL,
    "wodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetReps" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "WodExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WodResult" (
    "id" TEXT NOT NULL,
    "wodId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WodResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wod_gymId_date_idx" ON "Wod"("gymId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Wod_gymId_date_key" ON "Wod"("gymId", "date");

-- CreateIndex
CREATE INDEX "WodExercise_wodId_idx" ON "WodExercise"("wodId");

-- CreateIndex
CREATE INDEX "WodResult_wodId_userId_idx" ON "WodResult"("wodId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WodResult_wodId_exerciseId_userId_key" ON "WodResult"("wodId", "exerciseId", "userId");

-- AddForeignKey
ALTER TABLE "GymFeedback" ADD CONSTRAINT "GymFeedback_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wod" ADD CONSTRAINT "Wod_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WodExercise" ADD CONSTRAINT "WodExercise_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WodResult" ADD CONSTRAINT "WodResult_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WodResult" ADD CONSTRAINT "WodResult_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "WodExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WodResult" ADD CONSTRAINT "WodResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
