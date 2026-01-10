# Migration Execution Plan - Production Deployment

**Status:** READY FOR EXECUTION (Manual steps required)
**Risk Level:** MEDIUM (schema changes, data migration)
**Estimated Downtime:** 2-5 minutes
**Rollback Time:** < 1 minute (if needed)

---

## Pre-Migration Checklist

### 1. Backup Production Database
```bash
# Railway automatic backups should be enabled
# Verify in Railway dashboard: Settings → Backups

# Or create manual backup via Railway CLI:
railway run pg_dump -Fc > backup_$(date +%Y%m%d_%H%M%S).dump
```

**✅ Verify backup exists before proceeding**

### 2. Set Up Staging Database (Optional but Recommended)

```bash
# Create a new Railway service for staging
railway init
railway add
# Select PostgreSQL

# Restore production backup to staging
railway run pg_restore -d $DATABASE_URL backup_YYYYMMDD_HHMMSS.dump

# Test migration on staging first
```

### 3. Schedule Maintenance Window

**Recommended:** Low-traffic period (e.g., 2-4 AM local time)
**Duration:** 30 minutes (migration should take 2-5 min, buffer for issues)
**Communication:** Notify users if applicable

---

## Migration Execution Steps

### Step 1: Create .env File

Create `apps/api/.env` with your database URL:

```bash
cd /Users/user/relationship-ref-1/apps/api
cat > .env <<EOF
DATABASE_URL="postgresql://postgres:OcaRNUIKtrbEdRUyqiFseppKuKtjnjMz@trolley.proxy.rlwy.net:11327/railway"
EOF
```

### Step 2: Run Prisma Migration

```bash
cd /Users/user/relationship-ref-1/apps/api

# Generate Prisma client first
npx prisma generate

# Create migration (development mode - creates and applies)
npx prisma migrate dev --name add_multi_relationship_support

# OR for production (applies only, no prompts):
npx prisma migrate deploy
```

**This will:**
1. Create new tables: `relationships`, `relationship_members`, `relationship_lifecycle_events`
2. Add new columns to existing tables
3. Migrate all existing couples to relationships
4. Create relationship members (2 per couple)
5. Create lifecycle events

### Step 3: Verify Migration Success

```bash
# Connect to database and run verification queries
npx prisma studio
# Or use psql:

psql "$DATABASE_URL" <<EOF
-- Verify relationship count matches couples
SELECT
  (SELECT COUNT(*) FROM relationships) as relationship_count,
  (SELECT COUNT(*) FROM couples) as couple_count,
  (SELECT COUNT(*) FROM relationship_members) as member_count;

-- Verify all sessions have a relationship
SELECT COUNT(*) FROM sessions WHERE "coupleId" IS NULL AND "relationshipId" IS NULL;
-- Expected: 0

-- Check for orphaned data
SELECT COUNT(*) FROM relationships r
LEFT JOIN relationship_members rm ON rm."relationshipId" = r.id
WHERE rm.id IS NULL;
-- Expected: 0
EOF
```

### Step 4: Test Application

```bash
# Start the API server
cd /Users/user/relationship-ref-1/apps/api
npm run dev

# Test critical endpoints:
curl http://localhost:3000/api/couples/me
curl http://localhost:3000/api/sessions
curl http://localhost:3000/api/gamification/dashboard
```

### Step 5: Deploy to Railway

```bash
# Migration will run automatically on deploy via Prisma migrate deploy
git add .
git commit -m "Add multi-relationship database migration"
git push origin main

# Railway will detect changes and redeploy
# Monitor logs in Railway dashboard
```

---

## Rollback Plan (If Issues Occur)

### Option 1: Restore from Backup (Fastest)

```bash
# Stop the service in Railway dashboard
# Restore from backup:
railway run pg_restore -c -d $DATABASE_URL backup_YYYYMMDD_HHMMSS.dump
# Redeploy previous Git commit
```

### Option 2: Manual Rollback (If backup unavailable)

```bash
psql "$DATABASE_URL" < /Users/user/relationship-ref-1/apps/api/prisma/migrations/MANUAL_add_multi_relationship_support.sql
# Run the ROLLBACK PLAN section (commented out in that file)
```

---

## Post-Migration Monitoring

### Metrics to Watch (First 24 Hours)

1. **API Error Rate**: Should remain < 1%
2. **Response Times**: Should not increase significantly
3. **Database Connections**: Monitor for connection pool exhaustion
4. **Query Performance**: Check for slow queries on new tables

### Railway Monitoring

```bash
# View logs
railway logs

# Monitor database metrics in Railway dashboard:
# - Active connections
# - Query performance
# - Storage usage
```

### Known Issues to Watch For

| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing relationship for session | "Cannot find couple" errors | Run migration verification queries, check data integrity |
| Slow queries on new tables | High response times | Add missing indexes (migration includes them) |
| Duplicate invite codes | "Invite code already exists" | Regenerate codes for relationships |

---

## Production Deployment Timeline

**T-30min:** Announce maintenance window
**T-15min:** Create backup
**T-5min:** Stop accepting new sessions (optional)
**T-0:** Run migration
**T+2min:** Verify migration success
**T+5min:** Test critical endpoints
**T+10min:** Resume normal operation
**T+15min:** Monitor for issues

---

## Alternative: Local Development First

If you want to test everything locally before production:

```bash
# Install PostgreSQL locally
brew install postgresql
brew services start postgresql

# Create local database
createdb relationship_referee_dev

# Update .env to use local database
cat > apps/api/.env <<EOF
DATABASE_URL="postgresql://localhost:5432/relationship_referee_dev"
EOF

# Run migration on local DB
cd apps/api
npx prisma migrate dev --name add_multi_relationship_support

# Test all changes locally
npm run dev

# Once verified, then deploy to production
```

---

## Decision Required

**I cannot execute the migration without your explicit choice:**

**[ ] Option A:** I want to test on local/staging database first (SAFE)
**[ ] Option B:** I understand the risks and want to proceed with production migration (RISKY)
**[ ] Option C:** I'll handle the migration manually using the SQL script provided

**If Option B:** Please type: "I acknowledge the risk and approve production migration"

---

## Files Ready for Migration

✅ `apps/api/prisma/schema.prisma` - Updated schema
✅ `apps/api/prisma/migrations/MANUAL_add_multi_relationship_support.sql` - Migration SQL
✅ `docs/PHASE_1_MIGRATION_STATUS.md` - Detailed documentation
✅ `docs/EXPANSION_PLAN.md` - Overall strategy

**Next Step:** Your decision on how to proceed safely.
