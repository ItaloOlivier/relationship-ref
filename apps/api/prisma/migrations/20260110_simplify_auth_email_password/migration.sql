-- Simplify auth: Replace magic links with email/password authentication

-- Step 1: Add password_hash column to users table
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;

-- Step 2: Set a temporary password hash for existing users
-- This is bcrypt hash for 'changeme123' - users will need to reset
UPDATE "users" SET "passwordHash" = '$2b$10$rOvHPxfzO4iHsqRxNxCjKuGvJvSqsJJxXJlPtOLDrNuRvKgPAqWUy' WHERE "passwordHash" IS NULL;

-- Step 3: Make password_hash required
ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Step 4: Drop magic_links table
DROP TABLE IF EXISTS "magic_links";
