-- AlterEnum
ALTER TYPE "CheckinMethod" ADD VALUE 'SOCIAL_MEDIA';

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Gym" ALTER COLUMN "gymCode" DROP DEFAULT;
