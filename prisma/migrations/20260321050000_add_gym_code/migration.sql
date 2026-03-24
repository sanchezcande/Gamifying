-- AlterTable
ALTER TABLE "Gym" ADD COLUMN "gymCode" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Gym_gymCode_key" ON "Gym"("gymCode");
