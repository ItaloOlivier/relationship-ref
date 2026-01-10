-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "voiceNoteCount" INTEGER,
ADD COLUMN     "voiceNoteFilenames" TEXT[],
ADD COLUMN     "voiceNoteDurations" INTEGER[];
