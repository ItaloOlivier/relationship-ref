-- CreateEnum
CREATE TYPE "SessionSourceType" AS ENUM ('AUDIO', 'WHATSAPP_CHAT');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "chatParticipants" TEXT[],
ADD COLUMN     "importedFileName" TEXT,
ADD COLUMN     "importedMessageCount" INTEGER,
ADD COLUMN     "sourceType" "SessionSourceType" NOT NULL DEFAULT 'AUDIO';
