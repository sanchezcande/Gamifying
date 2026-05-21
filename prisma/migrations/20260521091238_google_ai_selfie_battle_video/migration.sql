-- CreateEnum
CREATE TYPE "BattleVideoStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "Battle" ADD COLUMN     "videoStatus" "BattleVideoStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selfiePhoto" TEXT;
