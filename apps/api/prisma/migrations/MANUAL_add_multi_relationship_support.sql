-- Migration: Add Multi-Relationship Support
-- Date: 2026-01-10
-- Status: DRAFT - Requires review and testing before execution
--
-- IMPORTANT: This migration MUST be tested on a staging database before production
-- IMPORTANT: Create a full database backup before running this migration
--
-- Execution Steps:
-- 1. Backup production database
-- 2. Run on staging database and verify data integrity
-- 3. Run all application tests
-- 4. Schedule production migration during low-traffic window
-- 5. Monitor for issues and be prepared to rollback

-- ============================================================================
-- STEP 1: Create new enum types
-- ============================================================================

CREATE TYPE "RelationshipType" AS ENUM (
  'ROMANTIC_COUPLE',
  'ROMANTIC_POLYAMOROUS',
  'FRIENDSHIP',
  'FAMILY_PARENT_CHILD',
  'FAMILY_SIBLINGS',
  'FAMILY_EXTENDED',
  'BUSINESS_COFOUNDERS',
  'BUSINESS_TEAM',
  'PROFESSIONAL_MANAGER_EMPLOYEE',
  'PROFESSIONAL_PEERS',
  'CUSTOM'
);

CREATE TYPE "RelationshipStatus" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'ENDED_MUTUAL',
  'ENDED_UNILATERAL',
  'ARCHIVED'
);

-- ============================================================================
-- STEP 2: Create new relationship tables
-- ============================================================================

CREATE TABLE "relationships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "RelationshipType" NOT NULL DEFAULT 'ROMANTIC_COUPLE',
    "status" "RelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT,
    "inviteCode" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT
);

CREATE TABLE "relationship_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relationshipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    CONSTRAINT "relationship_members_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE,
    CONSTRAINT "relationship_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "relationship_lifecycle_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relationshipId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "triggeredByUserId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relationship_lifecycle_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE,
    CONSTRAINT "relationship_lifecycle_events_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create indexes for performance
CREATE UNIQUE INDEX "relationship_members_relationshipId_userId_key" ON "relationship_members"("relationshipId", "userId");
CREATE INDEX "relationship_members_userId_idx" ON "relationship_members"("userId");
CREATE INDEX "relationship_members_relationshipId_idx" ON "relationship_members"("relationshipId");
CREATE INDEX "relationship_lifecycle_events_relationshipId_createdAt_idx" ON "relationship_lifecycle_events"("relationshipId", "createdAt");

-- ============================================================================
-- STEP 3: Add new columns to existing tables for dual support
-- ============================================================================

-- Add relationshipId to sessions (nullable for backward compatibility)
ALTER TABLE "sessions" ADD COLUMN "relationshipId" TEXT;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE;
CREATE INDEX "sessions_relationshipId_idx" ON "sessions"("relationshipId");

-- Add WhatsApp sharing fields to sessions
ALTER TABLE "sessions" ADD COLUMN "shareToken" TEXT UNIQUE;
ALTER TABLE "sessions" ADD COLUMN "shareTokenExpiry" TIMESTAMP(3);
ALTER TABLE "sessions" ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Make coupleId nullable in sessions (was required before)
ALTER TABLE "sessions" ALTER COLUMN "coupleId" DROP NOT NULL;

-- Add relationshipId to emotional_bank_ledgers
ALTER TABLE "emotional_bank_ledgers" ADD COLUMN "relationshipId" TEXT UNIQUE;
ALTER TABLE "emotional_bank_ledgers" ADD CONSTRAINT "emotional_bank_ledgers_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE;

-- Make coupleId nullable and non-unique (was unique before)
ALTER TABLE "emotional_bank_ledgers" DROP CONSTRAINT IF EXISTS "emotional_bank_ledgers_coupleId_key";
ALTER TABLE "emotional_bank_ledgers" ALTER COLUMN "coupleId" DROP NOT NULL;
ALTER TABLE "emotional_bank_ledgers" ADD CONSTRAINT "emotional_bank_ledgers_coupleId_unique" UNIQUE ("coupleId");

-- Add relationshipId to quests
ALTER TABLE "quests" ADD COLUMN "relationshipId" TEXT;
ALTER TABLE "quests" ADD CONSTRAINT "quests_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE;
CREATE INDEX "quests_relationshipId_idx" ON "quests"("relationshipId");

-- Make coupleId nullable in quests
ALTER TABLE "quests" ALTER COLUMN "coupleId" DROP NOT NULL;

-- Add relationshipId to weekly_reports
ALTER TABLE "weekly_reports" ADD COLUMN "relationshipId" TEXT;
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE;

-- Drop old unique constraint and add new ones
ALTER TABLE "weekly_reports" DROP CONSTRAINT IF EXISTS "weekly_reports_coupleId_weekStart_key";
ALTER TABLE "weekly_reports" ALTER COLUMN "coupleId" DROP NOT NULL;
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_coupleId_weekStart_unique" UNIQUE ("coupleId", "weekStart");
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_relationshipId_weekStart_unique" UNIQUE ("relationshipId", "weekStart");

-- Add relationshipId to relationship_dynamics
ALTER TABLE "relationship_dynamics" ADD COLUMN "relationshipId" TEXT UNIQUE;
ALTER TABLE "relationship_dynamics" ADD CONSTRAINT "relationship_dynamics_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE;

-- Make coupleId nullable and non-unique in relationship_dynamics
ALTER TABLE "relationship_dynamics" DROP CONSTRAINT IF EXISTS "relationship_dynamics_coupleId_key";
ALTER TABLE "relationship_dynamics" ALTER COLUMN "coupleId" DROP NOT NULL;
ALTER TABLE "relationship_dynamics" ADD CONSTRAINT "relationship_dynamics_coupleId_unique" UNIQUE ("coupleId");

-- ============================================================================
-- STEP 4: Migrate existing couples data to relationships
-- ============================================================================

-- Insert all couples as relationships (type = ROMANTIC_COUPLE, status = ACTIVE)
INSERT INTO "relationships" (
  "id",
  "type",
  "status",
  "name",
  "inviteCode",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  'ROMANTIC_COUPLE'::"RelationshipType",
  'ACTIVE'::"RelationshipStatus",
  "name",
  "inviteCode",
  "createdAt",
  "updatedAt"
FROM "couples";

-- Create relationship members from partner1
INSERT INTO "relationship_members" (
  "id",
  "relationshipId",
  "userId",
  "joinedAt"
)
SELECT
  gen_random_uuid()::TEXT,
  c."id",
  c."partner1Id",
  c."createdAt"
FROM "couples" c
WHERE c."partner1Id" IS NOT NULL;

-- Create relationship members from partner2
INSERT INTO "relationship_members" (
  "id",
  "relationshipId",
  "userId",
  "joinedAt"
)
SELECT
  gen_random_uuid()::TEXT,
  c."id",
  c."partner2Id",
  c."createdAt"
FROM "couples" c
WHERE c."partner2Id" IS NOT NULL;

-- Create lifecycle events for all migrated relationships
INSERT INTO "relationship_lifecycle_events" (
  "id",
  "relationshipId",
  "eventType",
  "createdAt"
)
SELECT
  gen_random_uuid()::TEXT,
  r."id",
  'CREATED',
  r."createdAt"
FROM "relationships" r;

-- ============================================================================
-- STEP 5: Update foreign key references in existing data
-- ============================================================================

-- Update sessions to reference relationships
UPDATE "sessions"
SET "relationshipId" = "coupleId"
WHERE "coupleId" IS NOT NULL;

-- Update emotional_bank_ledgers to reference relationships
UPDATE "emotional_bank_ledgers"
SET "relationshipId" = "coupleId"
WHERE "coupleId" IS NOT NULL;

-- Update quests to reference relationships
UPDATE "quests"
SET "relationshipId" = "coupleId"
WHERE "coupleId" IS NOT NULL;

-- Update weekly_reports to reference relationships
UPDATE "weekly_reports"
SET "relationshipId" = "coupleId"
WHERE "coupleId" IS NOT NULL;

-- Update relationship_dynamics to reference relationships
UPDATE "relationship_dynamics"
SET "relationshipId" = "coupleId"
WHERE "coupleId" IS NOT NULL;

-- ============================================================================
-- STEP 6: Verification queries (run after migration)
-- ============================================================================

-- Verify relationship count matches couples count
-- SELECT
--   (SELECT COUNT(*) FROM "relationships") as relationship_count,
--   (SELECT COUNT(*) FROM "couples") as couple_count,
--   (SELECT COUNT(*) FROM "relationship_members") as member_count,
--   (SELECT COUNT(*) FROM "couples" WHERE "partner2Id" IS NOT NULL) * 2 +
--   (SELECT COUNT(*) FROM "couples" WHERE "partner2Id" IS NULL) as expected_member_count;

-- Verify all sessions have either coupleId or relationshipId
-- SELECT COUNT(*) FROM "sessions" WHERE "coupleId" IS NULL AND "relationshipId" IS NULL;
-- -- Expected: 0

-- Verify relationship members have valid users
-- SELECT COUNT(*) FROM "relationship_members" rm
-- LEFT JOIN "users" u ON u."id" = rm."userId"
-- WHERE u."id" IS NULL;
-- -- Expected: 0

-- Verify no orphaned relationships
-- SELECT COUNT(*) FROM "relationships" r
-- LEFT JOIN "relationship_members" rm ON rm."relationshipId" = r."id"
-- WHERE rm."id" IS NULL;
-- -- Expected: 0 (unless couples with no partners existed)

-- ============================================================================
-- ROLLBACK PLAN (if migration fails)
-- ============================================================================

-- ROLLBACK STEP 1: Drop new tables
-- DROP TABLE IF EXISTS "relationship_lifecycle_events";
-- DROP TABLE IF EXISTS "relationship_members";
-- DROP TABLE IF EXISTS "relationships";

-- ROLLBACK STEP 2: Drop new columns
-- ALTER TABLE "sessions" DROP COLUMN IF EXISTS "relationshipId";
-- ALTER TABLE "sessions" DROP COLUMN IF EXISTS "shareToken";
-- ALTER TABLE "sessions" DROP COLUMN IF EXISTS "shareTokenExpiry";
-- ALTER TABLE "sessions" DROP COLUMN IF EXISTS "shareEnabled";
-- ALTER TABLE "emotional_bank_ledgers" DROP COLUMN IF EXISTS "relationshipId";
-- ALTER TABLE "quests" DROP COLUMN IF EXISTS "relationshipId";
-- ALTER TABLE "weekly_reports" DROP COLUMN IF EXISTS "relationshipId";
-- ALTER TABLE "relationship_dynamics" DROP COLUMN IF EXISTS "relationshipId";

-- ROLLBACK STEP 3: Restore NOT NULL constraints
-- ALTER TABLE "sessions" ALTER COLUMN "coupleId" SET NOT NULL;
-- ALTER TABLE "emotional_bank_ledgers" ALTER COLUMN "coupleId" SET NOT NULL;
-- ALTER TABLE "quests" ALTER COLUMN "coupleId" SET NOT NULL;
-- ALTER TABLE "weekly_reports" ALTER COLUMN "coupleId" SET NOT NULL;
-- ALTER TABLE "relationship_dynamics" ALTER COLUMN "coupleId" SET NOT NULL;

-- ROLLBACK STEP 4: Drop new enum types
-- DROP TYPE IF EXISTS "RelationshipStatus";
-- DROP TYPE IF EXISTS "RelationshipType";

-- ROLLBACK STEP 5: Restore database from backup
-- pg_restore -d relationship_referee /path/to/backup.dump

-- ============================================================================
-- POST-MIGRATION TASKS
-- ============================================================================

-- 1. Run application tests
-- 2. Verify mobile app can still fetch sessions
-- 3. Check emotional bank balances are correct
-- 4. Verify quest completion tracking works
-- 5. Monitor error logs for migration-related issues
-- 6. Check API response times (indexes should help)
-- 7. Verify backward compatibility (couples endpoints still work)

-- ============================================================================
-- DEPRECATION NOTICE
-- ============================================================================

-- The "couples" table is kept for backward compatibility
-- All new code should use "relationships" and "relationship_members"
-- The "couples" table may be dropped in a future migration after:
--   1. All services updated to use relationships
--   2. All API endpoints migrated
--   3. Mobile app updated to use new endpoints
--   4. Minimum 90 days of successful operation
--   5. Zero usage of legacy couple endpoints (monitored via logs)
