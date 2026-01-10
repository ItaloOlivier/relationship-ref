# Phase 1 Migration Status - Data Model Migration

**Date:** 2026-01-10
**Status:** IN PROGRESS - Schema Updated, Migration Pending
**Next Steps:** Create migration, update services, test

---

## ✅ Completed

### 1. Prisma Schema Updates

Successfully added the following models to support multi-relationship functionality while maintaining backward compatibility:

#### New Models Added

**`Relationship`** (Lines 78-99)
```prisma
model Relationship {
  id          String             @id @default(cuid())
  type        RelationshipType   @default(ROMANTIC_COUPLE)
  status      RelationshipStatus @default(ACTIVE)
  name        String?
  inviteCode  String             @unique
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  endedAt     DateTime?
  endReason   String?

  members             RelationshipMember[]
  sessions            Session[]
  emotionalBankLedger EmotionalBankLedger?
  weeklyReports       WeeklyReport[]
  quests              Quest[]
  relationshipDynamic RelationshipDynamic?
  lifecycleEvents     RelationshipLifecycleEvent[]
}
```

**`RelationshipMember`** (Lines 101-115)
- Junction table supporting variable group sizes (2-10 participants)
- Tracks `joinedAt` and `leftAt` timestamps
- Optional `role` field for context-specific roles

**`RelationshipLifecycleEvent`** (Lines 117-130)
- Tracks all relationship state changes
- Event types: CREATED, MEMBER_JOINED, MEMBER_LEFT, PAUSED, RESUMED, ENDED_MUTUAL, ENDED_UNILATERAL, ARCHIVED
- Audit trail with `triggeredBy` user reference

#### New Enums Added

**`RelationshipType`** (Lines 56-68)
- ROMANTIC_COUPLE
- ROMANTIC_POLYAMOROUS
- FRIENDSHIP
- FAMILY_PARENT_CHILD
- FAMILY_SIBLINGS
- FAMILY_EXTENDED
- BUSINESS_COFOUNDERS
- BUSINESS_TEAM
- PROFESSIONAL_MANAGER_EMPLOYEE
- PROFESSIONAL_PEERS
- CUSTOM

**`RelationshipStatus`** (Lines 70-76)
- ACTIVE
- PAUSED
- ENDED_MUTUAL
- ENDED_UNILATERAL
- ARCHIVED

#### Updated Models for Dual Support

All the following models now support BOTH legacy `Couple` and new `Relationship`:

**`Session`** (Lines 175-212)
- Added `relationshipId` field (nullable)
- Added `shareToken`, `shareTokenExpiry`, `shareEnabled` for WhatsApp sharing
- Maintains `coupleId` for backward compatibility

**`EmotionalBankLedger`** (Lines 255-269)
- Supports both `coupleId` and `relationshipId`

**`Quest`** (Lines 309-331)
- Supports both `coupleId` and `relationshipId`

**`WeeklyReport`** (Lines 364-392)
- Supports both `coupleId` and `relationshipId`
- Unique constraints on both couple and relationship

**`RelationshipDynamic`** (Lines 548-594)
- Supports both `coupleId` and `relationshipId`

#### User Model Updates (Lines 14-38)

Added new relations:
```prisma
relationshipMemberships  RelationshipMember[]
triggeredLifecycleEvents RelationshipLifecycleEvent[]
```

### 2. Prisma Client Generation

✅ Successfully generated Prisma Client (v6.19.1)
✅ Schema formatting passed
✅ No compilation errors

---

## 🔄 In Progress

### Phase 1.2: Create Migration Script

**Task:** Write Prisma migration to:
1. Create new tables: `relationships`, `relationship_members`, `relationship_lifecycle_events`
2. Add new columns to existing tables (Session, EmotionalBankLedger, Quest, etc.)
3. Migrate existing `couples` data to `relationships` + `relationship_members`
4. Maintain backward compatibility during transition

**Migration Strategy:**
```sql
-- Step 1: Create new tables
CREATE TABLE "relationships" (...);
CREATE TABLE "relationship_members" (...);
CREATE TABLE "relationship_lifecycle_events" (...);

-- Step 2: Migrate existing couples
INSERT INTO "relationships" (id, type, status, name, inviteCode, createdAt, updatedAt)
SELECT id, 'ROMANTIC_COUPLE', 'ACTIVE', name, inviteCode, createdAt, updatedAt
FROM "couples";

-- Step 3: Create relationship members from couples
INSERT INTO "relationship_members" (relationshipId, userId, joinedAt)
SELECT id AS relationshipId, partner1Id AS userId, createdAt AS joinedAt
FROM "couples"
WHERE partner1Id IS NOT NULL;

INSERT INTO "relationship_members" (relationshipId, userId, joinedAt)
SELECT id AS relationshipId, partner2Id AS userId, createdAt AS joinedAt
FROM "couples"
WHERE partner2Id IS NOT NULL;

-- Step 4: Create lifecycle events for migrated couples
INSERT INTO "relationship_lifecycle_events" (relationshipId, eventType, createdAt)
SELECT id AS relationshipId, 'CREATED', createdAt
FROM "relationships";

-- Step 5: Update existing sessions to reference relationships
UPDATE "sessions"
SET relationshipId = coupleId
WHERE coupleId IS NOT NULL;

-- Similar updates for EmotionalBankLedger, Quest, WeeklyReport, RelationshipDynamic
```

**Command:**
```bash
cd apps/api
npx prisma migrate dev --name add_multi_relationship_support
```

---

## ⏳ Pending

### Phase 1.3: Update Couples Service

**Location:** `apps/api/src/couples/couples.service.ts`

**Changes Required:**

1. **Rename service:** `CouplesService` → `RelationshipsService`
2. **Update methods:**
   - `createCouple()` → `createRelationship({ type, name })`
   - `joinCouple()` → `joinRelationship({ inviteCode, role? })`
   - `getCoupleForUser()` → `getRelationshipsForUser()` (returns array)
   - `leaveCouple()` → `leaveRelationship({ relationshipId, reason? })`

3. **Remove single-couple constraint:**
```typescript
// REMOVE THIS CHECK:
if (existingCouple) {
  throw new ConflictException('User is already in a couple');
}

// ALLOW MULTIPLE:
// Users can create/join multiple relationships of different types
```

4. **Add relationship lifecycle tracking:**
```typescript
async createRelationship(userId: string, dto: CreateRelationshipDto) {
  const relationship = await this.prisma.relationship.create({
    data: {
      type: dto.type || 'ROMANTIC_COUPLE',
      name: dto.name,
      inviteCode: generateInviteCode(),
      members: {
        create: {
          userId,
          joinedAt: new Date(),
        },
      },
      lifecycleEvents: {
        create: {
          eventType: 'CREATED',
          triggeredByUserId: userId,
        },
      },
    },
    include: { members: true },
  });

  return relationship;
}
```

### Phase 1.4: Update All Service Queries

**Files to Update:**

1. **`apps/api/src/sessions/sessions.service.ts`**
   - Change `getCoupleForUser()` to get active relationships
   - Allow session creation with `relationshipId` parameter
   - Update all queries using `coupleId` to also check `relationshipId`

2. **`apps/api/src/gamification/gamification.service.ts`**
   - Update quest assignment to be per-relationship
   - Support multiple concurrent quests across different relationships

3. **`apps/api/src/gamification/emotional-bank.service.ts`**
   - Support relationship-scoped emotional banks

4. **`apps/api/src/personality/personality.controller.ts`**
   - Update comparison endpoint to handle relationships (not just couples)
   - Remove "both partners required" check for groups

5. **Query Pattern Changes:**
```typescript
// OLD:
const couple = await prisma.couple.findFirst({
  where: {
    OR: [
      { partner1Id: userId },
      { partner2Id: userId },
    ],
  },
});

// NEW:
const relationships = await prisma.relationship.findMany({
  where: {
    members: {
      some: {
        userId,
        leftAt: null, // Only active memberships
      },
    },
    status: 'ACTIVE',
  },
  include: {
    members: {
      where: { leftAt: null },
      include: { user: true },
    },
  },
});
```

### Phase 1.5: Write and Run Tests

**Test Coverage Required:**

1. **Unit Tests:**
   - `relationship.service.spec.ts` - CRUD operations
   - `relationship-member.service.spec.ts` - Join/leave flows
   - `relationship-lifecycle.service.spec.ts` - Status transitions

2. **Integration Tests:**
   - Create relationship with 1 member
   - Join relationship (2nd, 3rd member)
   - Leave relationship
   - Pause/resume/end relationship
   - Create session for specific relationship
   - Verify isolation between relationships

3. **Migration Tests:**
   - Run migration on copy of production data
   - Verify all couples migrated to relationships
   - Verify all relationship members created
   - Verify backward compatibility (couples table still accessible)

4. **Regression Tests:**
   - All existing couple-based tests must pass
   - Mobile app can still fetch sessions
   - Emotional bank balance correct after migration

**Commands:**
```bash
cd apps/api
npm run test -- relationship
npm run test:e2e
```

### Phase 1.6: Update Documentation and Commit

1. Update `CLAUDE.md`:
   - Mark Phase 1 complete
   - Document schema changes
   - Add migration notes

2. Update API documentation (Swagger):
   - Add relationship endpoints
   - Deprecate couple endpoints (but keep for compatibility)

3. Git commit:
```bash
git add apps/api/prisma/schema.prisma
git add apps/api/prisma/migrations/
git commit -m "Phase 1: Data Model Migration - Multi-Relationship Support

- Add Relationship, RelationshipMember, RelationshipLifecycleEvent models
- Add RelationshipType and RelationshipStatus enums
- Update Session, EmotionalBankLedger, Quest, WeeklyReport, RelationshipDynamic for dual support
- Add WhatsApp sharing fields to Session (shareToken, shareTokenExpiry, shareEnabled)
- Migrate existing couples to relationships
- Maintain backward compatibility with Couple model

Breaking Changes: None (backward compatible)
Migration Required: Yes (automatic via Prisma migrate)

Phase 1 of 5-phase expansion plan documented in docs/EXPANSION_PLAN.md"

git push origin main
```

---

## 🚨 Risks & Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Data loss during migration | Low | Dry-run on staging, backup before production |
| Breaking existing mobile app | Medium | Keep backward-compatible API responses, test thoroughly |
| Migration takes too long (locks tables) | Medium | Add indexes first, use batch processing, run during low-traffic window |
| Duplicate inviteCode collisions | Low | Generate new codes for relationships, keep couple codes unchanged |

---

## 🔗 Dependencies

**Blocks:**
- Phase 2: Multi-Relationship Support (requires Phase 1 migration complete)
- Phase 3: Variable Group Sizes (requires relationship member junction table)

**Blocked By:**
- None (Phase 1 is foundation)

---

## 📊 Progress Metrics

- [x] Schema design complete
- [x] Prisma client generation successful
- [ ] Migration script created
- [ ] Migration tested on staging
- [ ] Services updated
- [ ] Tests written
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Deployed to production

**Completion:** 30% (2/7 substeps)

---

## ⏭️ Next Actions

1. Create Prisma migration:
   ```bash
   cd apps/api
   npx prisma migrate dev --create-only --name add_multi_relationship_support
   # Edit migration file to add data migration logic
   npx prisma migrate dev
   ```

2. Update RelationshipsService (rename from CouplesService)

3. Update all service queries to use relationship member lookups

4. Write comprehensive tests

5. Run tests locally until all pass

6. Update CLAUDE.md and commit

---

## 📝 Notes

- The `Couple` model is intentionally kept for backward compatibility
- All new code should use `Relationship` and `RelationshipMember`
- The `Couple` model may be deprecated in a future phase after full migration
- WhatsApp sharing fields added to `Session` model (Phase 2 prep)
- Relationship lifecycle events enable breakup analytics (Phase 6 feature)

---

**Last Updated:** 2026-01-10
**Updated By:** Claude (Business OS Protocol Execution)
