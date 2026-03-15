-- AlterTable
ALTER TABLE "Gym" ADD COLUMN "apiKey" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "Gym" ADD COLUMN "qrSecret" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

-- CreateIndex
CREATE UNIQUE INDEX "Gym_qrSecret_key" ON "Gym"("qrSecret");
CREATE UNIQUE INDEX "Gym_apiKey_key" ON "Gym"("apiKey");
