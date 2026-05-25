-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('PENDING_MOVES', 'RESOLVED');

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_winnerId_fkey";

-- AlterTable
ALTER TABLE "Battle" ADD COLUMN     "challengerMoves" JSONB,
ADD COLUMN     "defenderMoves" JSONB,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "roundResults" JSONB,
ADD COLUMN     "status" "BattleStatus" NOT NULL DEFAULT 'RESOLVED',
ALTER COLUMN "winnerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
