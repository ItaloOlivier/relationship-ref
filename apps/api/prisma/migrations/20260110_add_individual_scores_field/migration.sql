-- AlterTable: Add individualScores field to AnalysisResult
-- This field stores per-speaker score breakdowns for accountability and individual growth tracking
-- Format: Array of { userId?, speaker, greenCardCount, yellowCardCount, redCardCount, personalScore, bankContribution, horsemenUsed[], repairAttemptCount }

ALTER TABLE "analysis_results" ADD COLUMN "individualScores" JSONB;

-- No data migration needed: existing rows will have NULL, which is acceptable
-- New analyses will populate this field with speaker-attributed scores
