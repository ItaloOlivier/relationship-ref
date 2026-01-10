# Relationship Referee - Expansion Plan

**Date:** 2026-01-10
**Status:** Planning Phase
**Goal:** Transform from romantic-couple-only app to multi-relationship-type platform

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Constraints](#current-constraints)
3. [Proposed Architecture](#proposed-architecture)
4. [Implementation Phases](#implementation-phases)
5. [Technical Design](#technical-design)
6. [WhatsApp Report Sharing](#whatsapp-report-sharing)
7. [Relationship Lifecycle Management](#relationship-lifecycle-management)

---

## Executive Summary

### Vision
Expand Relationship Referee from a romantic-couple-only app to a comprehensive communication coaching platform supporting:
- **Romantic relationships** (current use case)
- **Friendships** (2+ people)
- **Family relationships** (parent-child, siblings, extended family)
- **Business partnerships** (co-founders, team dynamics)
- **Professional relationships** (manager-employee, colleagues)

### Key Improvements
1. **Multi-relationship type support** - Different relationship types with tailored coaching
2. **Variable group sizes** - Support 2+ participants, not just couples
3. **Relationship lifecycle management** - Handle active, paused, and ended relationships
4. **WhatsApp report sharing** - One-tap share of session insights
5. **Multiple concurrent relationships** - Users can track several relationships simultaneously

### Success Metrics
- Support 5+ relationship types
- Handle groups of 2-10 participants
- Enable report sharing with 90%+ delivery rate
- Track relationship lifecycle transitions with historical data retention

---

## Current Constraints

### Hard Constraints (Require Schema Changes)
| Constraint | Location | Impact |
|------------|----------|--------|
| Max 2 members (`partner1Id`, `partner2Id`) | `schema.prisma:51-70` | Cannot add 3rd person |
| User limited to 1 couple | `couples.service.ts:11-22` | Cannot track multiple relationships |
| Personality analysis requires exactly 2 | `profile-aggregator.service.ts:116` | Groups of 3+ get no analysis |
| Binary relationship dynamics (P1 vs P2) | `relationship-dynamics.service.ts:83` | No group dynamics |
| Single emotional bank per couple | `schema.prisma:161-195` | No individual tracking |

### Soft Constraints (Language/UI Only)
| Constraint | Location | Fix Complexity |
|------------|----------|----------------|
| Quest descriptions say "your partner" | `quests.service.ts:5-45` | Low - text changes |
| Weekly tips assume romantic dyad | `weekly-report.service.ts:139-168` | Medium - conditional text |
| Coaching prompts say "between partners" | `analysis.service.ts:151` | Medium - template system |
| Personality insights mention "intimacy" | `personality.controller.ts:269-343` | Medium - type-specific insights |
| Mobile UI says "Pair with Partner" | `couple_pairing_dialog.dart:81` | Low - UI text |

---

## Proposed Architecture

### 1. Relationship Model (Replaces "Couple")

```prisma
enum RelationshipType {
  ROMANTIC_COUPLE
  ROMANTIC_POLYAMOROUS
  FRIENDSHIP
  FAMILY_PARENT_CHILD
  FAMILY_SIBLINGS
  FAMILY_EXTENDED
  BUSINESS_COFOUNDERS
  BUSINESS_TEAM
  PROFESSIONAL_MANAGER_EMPLOYEE
  PROFESSIONAL_PEERS
  CUSTOM
}

enum RelationshipStatus {
  ACTIVE
  PAUSED        // Taking a break, can resume
  ENDED_MUTUAL  // Breakup/parting ways
  ENDED_UNILATERAL
  ARCHIVED      // Historical, read-only
}

model Relationship {
  id          String             @id @default(cuid())
  type        RelationshipType
  status      RelationshipStatus @default(ACTIVE)
  name        String?            // Optional display name
  inviteCode  String             @unique
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  endedAt     DateTime?          // When status changed to ENDED_*
  endReason   String?            // Freeform text or enum

  // Relations
  members              RelationshipMember[]
  sessions             Session[]
  emotionalBankLedger  EmotionalBankLedger?
  weeklyReports        WeeklyReport[]
  quests               Quest[]
  relationshipDynamic  RelationshipDynamic?
}

model RelationshipMember {
  id             String       @id @default(cuid())
  relationshipId String
  relationship   Relationship @relation(fields: [relationshipId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           String?      // e.g., "manager", "employee", "parent", "child" (optional)
  joinedAt       DateTime     @default(now())
  leftAt         DateTime?    // When they left (if status = ended)

  @@unique([relationshipId, userId])
  @@index([userId])
}
```

**Migration Path:**
- Rename `Couple` → `Relationship`
- Convert existing couples:
  ```sql
  -- For each existing couple:
  INSERT INTO RelationshipMember (relationshipId, userId, joinedAt)
  VALUES
    (couple.id, couple.partner1Id, couple.createdAt),
    (couple.id, couple.partner2Id, couple.createdAt);
  ```

---

### 2. Type-Specific Coaching Templates

```typescript
// apps/api/src/analysis/coaching-templates.ts

interface CoachingContext {
  relationshipType: RelationshipType;
  participantCount: number;
  participantRoles?: string[];
  culturalContext?: string; // Future: localization
}

class CoachingTemplateService {
  getSystemPrompt(context: CoachingContext): string {
    switch (context.relationshipType) {
      case 'ROMANTIC_COUPLE':
        return `You are a relationship coach analyzing a conversation between romantic partners.
Focus on: emotional safety, repair attempts, intimacy, conflict resolution.
Reference Gottman Method and attachment theory.`;

      case 'FRIENDSHIP':
        return `You are a communication coach analyzing a conversation between friends.
Focus on: mutual respect, boundary-setting, emotional support, shared activities.
Avoid romantic relationship assumptions.`;

      case 'BUSINESS_COFOUNDERS':
        return `You are a business partnership coach analyzing a conversation between co-founders.
Focus on: decision-making alignment, role clarity, conflict resolution, trust.
Use business partnership frameworks (e.g., Patrick Lencioni's 5 Dysfunctions).`;

      case 'FAMILY_PARENT_CHILD':
        return `You are a family communication coach analyzing a conversation between parent and child.
Focus on: active listening, validation, age-appropriate boundaries, emotional safety.
Reference authoritative parenting frameworks.`;

      case 'PROFESSIONAL_MANAGER_EMPLOYEE':
        return `You are a workplace communication coach analyzing a manager-employee conversation.
Focus on: clarity, feedback delivery, psychological safety, professional boundaries.
Avoid personal relationship advice.`;

      default:
        return `You are a communication coach analyzing a conversation.
Focus on: active listening, respect, clear communication, conflict resolution.`;
    }
  }

  getQuestTemplates(type: RelationshipType): QuestTemplate[] {
    // Return type-specific daily quests
  }

  getWeeklyTipTemplate(type: RelationshipType, metrics: any): string {
    // Return type-specific weekly tips
  }
}
```

---

### 3. Group Dynamics Analysis

```typescript
// apps/api/src/personality/group-dynamics.service.ts

interface GroupDynamicsAnalysis {
  conversationBalance: {
    [participantName: string]: {
      wordCount: number;
      percentage: number;
      dominanceLevel: 'DOMINANT' | 'BALANCED' | 'SUBMISSIVE';
    };
  };

  interactionPatterns: {
    // Who responds to whom most
    responseMatrix: { [from: string]: { [to: string]: number } };
    coalitions?: string[][]; // Detected sub-groups (if 3+)
  };

  emotionalTone: {
    [participantName: string]: {
      positiveRatio: number;
      negativeRatio: number;
      anxietyLevel: number;
    };
  };

  groupCohesion: number; // 0-100, based on alignment of emotional tone
  conflictLevel: 'LOW' | 'MODERATE' | 'HIGH';
  recommendations: string[];
}

class GroupDynamicsService {
  analyzeGroupDynamics(
    participants: ParticipantFeatures[],
    relationshipType: RelationshipType,
  ): GroupDynamicsAnalysis {
    // Generalized from current binary analysis
    // Handles 2+ participants
  }
}
```

---

### 4. Individual Emotional Banks

```prisma
// Allow tracking individual contributions AND relationship-level balance

model EmotionalBankLedger {
  id             String   @id @default(cuid())
  relationshipId String   @unique
  relationship   Relationship @relation(fields: [relationshipId], references: [id])
  balance        Int      @default(0)  // Aggregate balance
  entries        EmotionalBankEntry[]

  // NEW: Per-member sub-balances
  memberBalances EmotionalBankMemberBalance[]
}

model EmotionalBankMemberBalance {
  id        String @id @default(cuid())
  ledgerId  String
  ledger    EmotionalBankLedger @relation(fields: [ledgerId], references: [id])
  userId    String
  user      User   @relation(fields: [userId], references: [id])
  balance   Int    @default(0)  // This user's contribution to the relationship

  @@unique([ledgerId, userId])
}

model EmotionalBankEntry {
  id          String   @id @default(cuid())
  ledgerId    String
  ledger      EmotionalBankLedger @relation(fields: [ledgerId], references: [id])
  userId      String?  // Who performed the action
  user        User?    @relation(fields: [userId], references: [id])
  amount      Int      // +/- points
  sessionId   String?
  session     Session? @relation(fields: [sessionId], references: [id])
  description String
  createdAt   DateTime @default(now())
}
```

**Use Case:**
- Romantic couple: Shows "our balance" + individual contributions
- Friendship group: Each friend has their own balance showing reciprocity
- Business team: Track contribution equity

---

## WhatsApp Report Sharing

### Feature Specification

**User Story:**
> As a user who just completed a session, I want to share my Match Report with others (partner, friend, therapist) via WhatsApp so they can see the insights without needing the app.

### Implementation Design

#### 1. Public Report URL Generation

```prisma
model Session {
  id               String
  // ... existing fields
  shareToken       String?  @unique // Optional: for public sharing
  shareTokenExpiry DateTime? // Optional: expiration
  shareEnabled     Boolean @default(false)
}
```

```typescript
// apps/api/src/sessions/sessions.service.ts

async enableSharing(sessionId: string, userId: string, expiryHours: number = 168) {
  const session = await this.findById(sessionId, userId);

  const shareToken = crypto.randomBytes(32).toString('hex');
  const shareTokenExpiry = new Date();
  shareTokenExpiry.setHours(shareTokenExpiry.getHours() + expiryHours);

  await this.prisma.session.update({
    where: { id: sessionId },
    data: {
      shareToken,
      shareTokenExpiry,
      shareEnabled: true,
    },
  });

  return {
    shareUrl: `${process.env.WEB_APP_URL}/shared/report/${shareToken}`,
    expiresAt: shareTokenExpiry,
  };
}
```

#### 2. Public Report Endpoint

```typescript
// apps/api/src/sessions/sessions.controller.ts

@Get('shared/:shareToken')
@ApiOperation({ summary: 'Get shared report (no auth required)' })
async getSharedReport(@Param('shareToken') shareToken: string) {
  const session = await this.sessionsService.findByShareToken(shareToken);

  if (!session || !session.shareEnabled) {
    throw new NotFoundException('Shared report not found');
  }

  if (session.shareTokenExpiry && session.shareTokenExpiry < new Date()) {
    throw new GoneException('Shared link has expired');
  }

  // Return sanitized report (remove sensitive data)
  return this.sessionsService.getPublicReport(session.id);
}
```

#### 3. WhatsApp Share Deep Link

```typescript
// apps/mobile/lib/features/report/presentation/widgets/share_button.dart

void _shareViaWhatsApp(BuildContext context, String shareUrl) {
  final message = Uri.encodeComponent(
    '📊 Check out my Relationship Referee session report!\n\n' +
    'We scored ${report.overallScore}/100 in our conversation.\n\n' +
    'View the full report: $shareUrl'
  );

  final whatsappUrl = 'https://wa.me/?text=$message';

  launchUrl(Uri.parse(whatsappUrl), mode: LaunchMode.externalApplication);
}
```

#### 4. Web Report Viewer

```typescript
// apps/web/src/app/shared/report/[shareToken]/page.tsx (NEW)

export default async function SharedReportPage({ params }) {
  const { shareToken } = params;
  const report = await fetchSharedReport(shareToken);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
        <p className="text-sm">
          This is a shared session report. Download Relationship Referee to track your own conversations.
        </p>
        <a href="/download" className="text-blue-600 underline">Get the app →</a>
      </div>

      <ReportCard
        score={report.overallScore}
        greenCards={report.greenCardCount}
        yellowCards={report.yellowCardCount}
        redCards={report.redCardCount}
        bankChange={report.bankChange}
      />

      <InsightsSection insights={report.cards} />

      <CoachingSuggestions suggestions={report.coachingSuggestions} />
    </div>
  );
}
```

#### 5. Privacy Controls

```typescript
// Session settings UI

interface ShareSettings {
  enabled: boolean;
  expiryHours: number; // 24, 72, 168 (1 week), 0 (never)
  allowComments: boolean; // Future: recipient can leave notes
  hideParticipantNames: boolean; // Anonymize for therapist sharing
}
```

**Default Privacy:**
- Sharing disabled by default
- User must explicitly enable per session
- Shared reports redact audio URLs (never share raw audio publicly)
- Transcript optionally hidden (show only insights)

---

## Relationship Lifecycle Management

### Status Transitions

```
ACTIVE ──> PAUSED ──> ACTIVE (resumable)
  │          │
  └────> ENDED_MUTUAL ──> ARCHIVED
         ENDED_UNILATERAL ──> ARCHIVED
```

### Implementation

```typescript
// apps/api/src/relationships/relationship-lifecycle.service.ts

class RelationshipLifecycleService {
  async pauseRelationship(
    relationshipId: string,
    userId: string,
    reason?: string,
  ) {
    const relationship = await this.findById(relationshipId, userId);

    await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: 'PAUSED',
        updatedAt: new Date(),
      },
    });

    // Create lifecycle event
    await this.prisma.relationshipLifecycleEvent.create({
      data: {
        relationshipId,
        eventType: 'PAUSED',
        triggeredByUserId: userId,
        reason,
      },
    });

    return { success: true };
  }

  async endRelationship(
    relationshipId: string,
    userId: string,
    endType: 'MUTUAL' | 'UNILATERAL',
    reason?: string,
  ) {
    const relationship = await this.findById(relationshipId, userId);

    await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: endType === 'MUTUAL' ? 'ENDED_MUTUAL' : 'ENDED_UNILATERAL',
        endedAt: new Date(),
        endReason: reason,
      },
    });

    // Mark all members as left
    await this.prisma.relationshipMember.updateMany({
      where: { relationshipId },
      data: { leftAt: new Date() },
    });

    // Create lifecycle event
    await this.prisma.relationshipLifecycleEvent.create({
      data: {
        relationshipId,
        eventType: endType === 'MUTUAL' ? 'ENDED_MUTUAL' : 'ENDED_UNILATERAL',
        triggeredByUserId: userId,
        reason,
      },
    });

    return { success: true };
  }

  async archiveRelationship(relationshipId: string, userId: string) {
    // Move to ARCHIVED (read-only, hidden from active list)
    // All data retained for historical analysis
  }
}
```

### Lifecycle Events Tracking

```prisma
model RelationshipLifecycleEvent {
  id                String   @id @default(cuid())
  relationshipId    String
  relationship      Relationship @relation(fields: [relationshipId], references: [id], onDelete: Cascade)
  eventType         String   // CREATED, MEMBER_JOINED, MEMBER_LEFT, PAUSED, RESUMED, ENDED_MUTUAL, ENDED_UNILATERAL, ARCHIVED
  triggeredByUserId String?
  triggeredBy       User?    @relation(fields: [triggeredByUserId], references: [id])
  reason            String?  // Optional explanation
  metadata          Json?    // Additional context
  createdAt         DateTime @default(now())

  @@index([relationshipId, createdAt])
}
```

**Use Cases:**
1. **Breakup Analytics:**
   - "How long do most romantic couples last before ending?"
   - "What's the average time between PAUSED and ENDED?"

2. **Friendship Tracking:**
   - "How many active friendships does the average user maintain?"
   - "Do friendships that pause ever resume?"

3. **Business Partnerships:**
   - "Track co-founder relationship health over company lifecycle"
   - "Did communication improve or degrade before dissolution?"

### Historical Data Retention

**Policy:**
- ACTIVE/PAUSED relationships: Full access to all sessions
- ENDED relationships: Read-only access for 90 days, then archived
- ARCHIVED relationships: Metadata + aggregated insights only (raw transcripts deleted)

```typescript
// Cron job: Archive old ended relationships
async function archiveOldEndedRelationships() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const toArchive = await prisma.relationship.findMany({
    where: {
      status: { in: ['ENDED_MUTUAL', 'ENDED_UNILATERAL'] },
      endedAt: { lte: ninetyDaysAgo },
    },
  });

  for (const rel of toArchive) {
    await lifecycleService.archiveRelationship(rel.id, null);

    // Delete raw transcripts, keep only aggregated insights
    await prisma.session.updateMany({
      where: { relationshipId: rel.id },
      data: {
        transcript: null,
        audioUrl: null,
      },
    });
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation - Data Model Migration (Week 1-2)
**Goal:** Migrate from `Couple` to `Relationship` + `RelationshipMember` without breaking existing functionality.

**Tasks:**
1. Create new Prisma models (Relationship, RelationshipMember, RelationshipLifecycleEvent)
2. Write migration script to convert existing couples
3. Update all service queries to use RelationshipMember junction table
4. Add relationship type field (default all existing to ROMANTIC_COUPLE)
5. Add relationship status tracking (default ACTIVE)
6. **Tests:** Verify all existing API endpoints still work
7. **Deployment:** Zero-downtime migration with backward compatibility

**Success Criteria:**
- ✅ All existing couples migrated to Relationship + 2 members
- ✅ All API tests passing
- ✅ Zero data loss
- ✅ Existing mobile app continues working

---

### Phase 2: Multi-Relationship Support (Week 3-4)
**Goal:** Allow users to create and track multiple relationships simultaneously.

**Tasks:**
1. Remove "user can only be in one couple" constraint
2. Add relationship type selector in UI
3. Update session creation to support relationship selection
4. Add relationship switcher in mobile app navigation
5. Update gamification to be per-relationship (separate quests, banks)
6. **Tests:** Create user with 3 relationships (romantic, friend, business), verify isolation
7. **UI/UX:** Design relationship list screen with type badges

**Success Criteria:**
- ✅ Users can create 5+ relationships of different types
- ✅ Sessions correctly scoped to selected relationship
- ✅ Emotional bank balances separate per relationship
- ✅ Quests tracked independently per relationship

---

### Phase 3: Variable Group Sizes (Week 5-6)
**Goal:** Support groups of 3+ participants in a single relationship.

**Tasks:**
1. Remove 2-participant constraint from personality analysis
2. Implement `GroupDynamicsService` for N-participant analysis
3. Update report generation to handle group conversations
4. Add member management UI (add/remove members)
5. Update WhatsApp import to map 3+ participants
6. **Tests:** Create friendship with 4 members, import group chat, verify analysis
7. **Coaching:** Generalize prompts to handle groups

**Success Criteria:**
- ✅ Support groups of 2-10 participants
- ✅ Group dynamics analysis functional (conversation balance, coalitions)
- ✅ WhatsApp group chat import working
- ✅ Reports show per-participant insights

---

### Phase 4: Type-Specific Coaching (Week 7-8)
**Goal:** Tailor coaching suggestions to relationship type.

**Tasks:**
1. Implement `CoachingTemplateService` with type-specific prompts
2. Create quest templates for each relationship type
3. Generate weekly tips based on relationship type
4. Update personality insights to be context-aware
5. **Tests:** Run same transcript through different relationship types, verify different coaching
6. **Content:** Write coaching frameworks for 5 types

**Success Criteria:**
- ✅ 5 relationship types have distinct coaching templates
- ✅ Romantic couple: Gottman-based, mentions intimacy
- ✅ Business: Patrick Lencioni frameworks, no romance language
- ✅ Friendship: Boundary-setting, mutual support language
- ✅ Family: Age-appropriate, authoritative parenting references

---

### Phase 5: WhatsApp Report Sharing (Week 9-10)
**Goal:** Enable one-tap sharing of session reports via WhatsApp.

**Tasks:**
1. Add `shareToken`, `shareEnabled` to Session model
2. Implement public report endpoint (no auth)
3. Create web-based report viewer (Next.js app)
4. Add "Share Report" button in mobile app
5. Implement WhatsApp deep link with formatted message
6. Add privacy controls (expiry, anonymization options)
7. **Tests:** Generate share link, open in browser, verify renders correctly
8. **Analytics:** Track share rate, link opens

**Success Criteria:**
- ✅ Users can generate shareable link with 1 tap
- ✅ Link opens in browser without requiring login
- ✅ Report redacts sensitive data (audio, full transcript)
- ✅ Links expire after 7 days (configurable)
- ✅ 90%+ message delivery rate via WhatsApp

---

### Phase 6: Relationship Lifecycle Management (Week 11-12)
**Goal:** Handle paused and ended relationships gracefully with historical tracking.

**Tasks:**
1. Add relationship status transitions (ACTIVE → PAUSED → ENDED → ARCHIVED)
2. Implement lifecycle event tracking
3. Add "Pause Relationship" and "End Relationship" UI flows
4. Create archived relationships view (read-only)
5. Implement data retention policy (delete transcripts after 90 days)
6. Add breakup insights dashboard (aggregate analytics)
7. **Tests:** Pause relationship, verify sessions hidden but accessible; end relationship, verify archival
8. **Cron:** Set up archival job

**Success Criteria:**
- ✅ Users can pause/resume relationships
- ✅ Ended relationships move to archive after 90 days
- ✅ Historical data viewable (aggregated insights only)
- ✅ Lifecycle events tracked for analytics
- ✅ Breakup insights: average duration, common reasons

---

### Phase 7: Polish & Hardening (Week 13-14)
**Goal:** Production readiness, performance optimization, edge case handling.

**Tasks:**
1. Performance testing with 100+ relationships per user
2. Optimize queries with proper indexing
3. Add rate limiting on relationship creation
4. Implement conflict resolution (e.g., both partners try to end relationship)
5. Add relationship transfer (e.g., make someone else admin)
6. Create migration guide for existing users
7. **Tests:** Load testing, edge case coverage
8. **Documentation:** User guides for each relationship type

**Success Criteria:**
- ✅ All queries optimized (< 100ms p95)
- ✅ Edge cases handled gracefully
- ✅ Mobile app supports offline mode for viewing reports
- ✅ Documentation complete for 5 relationship types
- ✅ Zero critical bugs in production

---

## Migration Strategy for Existing Users

### Communication Plan
1. **In-App Announcement:** "Big Update! You can now track friendships, family, and work relationships too!"
2. **Email Campaign:** Explain new features, encourage trying multiple relationship types
3. **Tutorial:** First-time flow shows relationship type picker

### Data Migration
```sql
-- Step 1: Rename table
ALTER TABLE "Couple" RENAME TO "Relationship";

-- Step 2: Add new columns with defaults
ALTER TABLE "Relationship"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'ROMANTIC_COUPLE',
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "endedAt" TIMESTAMP,
  ADD COLUMN "endReason" TEXT;

-- Step 3: Create RelationshipMember table
CREATE TABLE "RelationshipMember" (
  "id" TEXT PRIMARY KEY,
  "relationshipId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT,
  "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "leftAt" TIMESTAMP,
  FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Step 4: Migrate existing couples to members
INSERT INTO "RelationshipMember" ("id", "relationshipId", "userId", "joinedAt")
SELECT
  gen_random_uuid(),
  id,
  "partner1Id",
  "createdAt"
FROM "Relationship"
WHERE "partner1Id" IS NOT NULL;

INSERT INTO "RelationshipMember" ("id", "relationshipId", "userId", "joinedAt")
SELECT
  gen_random_uuid(),
  id,
  "partner2Id",
  "createdAt"
FROM "Relationship"
WHERE "partner2Id" IS NOT NULL;

-- Step 5: Drop old columns (after verification)
ALTER TABLE "Relationship"
  DROP COLUMN "partner1Id",
  DROP COLUMN "partner2Id";
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data loss during migration | Low | Critical | Dry-run on staging, backup before production migration |
| Performance degradation (N+1 queries) | Medium | High | Implement proper eager loading, add indexes |
| User confusion (too many features) | Medium | Medium | Phased rollout, clear onboarding tutorial |
| Privacy breach (public share links) | Low | High | Require explicit opt-in, auto-expiry, redact sensitive data |
| Relationship type misuse (romantic advice for business) | Medium | Low | Clear type descriptions, show examples during creation |
| Complex multi-relationship UI | Medium | Medium | Simple relationship switcher, clear visual hierarchy |

---

## Success Metrics (3-Month Post-Launch)

| Metric | Target | Current |
|--------|--------|---------|
| Relationships per active user | 2.5 avg | 1.0 (couples only) |
| Non-romantic relationship % | 30% | 0% |
| Report shares per week | 1,000 | 0 |
| WhatsApp share link open rate | 60% | N/A |
| Ended relationships archived | 500+ | 0 |
| Average group size (friendships) | 3.2 | 2.0 (couples) |
| User retention (30-day) | 45% | TBD |

---

## Technical Debt Items

| Item | Phase | Priority | Estimated Effort |
|------|-------|----------|-----------------|
| Remove hardcoded 2-participant personality analysis | 3 | Critical | 3 days |
| Generalize emotional bank to individual tracking | 2 | High | 2 days |
| Rewrite all `findFirst({ OR: [partner1Id, partner2Id] })` queries | 1 | Critical | 2 days |
| Create type-specific coaching content | 4 | Medium | 5 days |
| Implement relationship transfer/ownership | 7 | Low | 2 days |
| Add conflict resolution for lifecycle transitions | 7 | Medium | 3 days |

---

## Open Questions

1. **Pricing Model:** Should multi-relationship support be premium?
2. **Group Size Limit:** Max 10 participants? Performance implications?
3. **Relationship Verification:** How to prevent abuse (fake business relationships)?
4. **Cross-Relationship Insights:** "Your communication style is consistent across relationships"?
5. **Therapist Mode:** Should we add a "therapist view" for shared reports?
6. **Export Options:** PDF, CSV exports for ended relationships?

---

## Appendix: Example Relationship Types

### 1. Romantic Couple (Existing)
- **Coaching Focus:** Intimacy, Gottman Method, attachment theory
- **Quests:** Date nights, appreciation exercises, conflict repair
- **Weekly Tips:** "This week had some challenging moments. Remember the 5:1 positivity ratio..."

### 2. Friendship (2-6 friends)
- **Coaching Focus:** Reciprocity, boundary-setting, emotional support
- **Quests:** Check in with a friend, plan a hangout, active listening practice
- **Weekly Tips:** "Great balance this week! Friendships thrive on consistent, low-pressure connection..."

### 3. Business Co-Founders (2-4 partners)
- **Coaching Focus:** Decision alignment, role clarity, trust, conflict resolution
- **Quests:** Weekly strategy sync, feedback exchange, vision alignment check
- **Weekly Tips:** "Noticed some tension around decision-making. Consider a RACI framework..."

### 4. Family - Parent & Child
- **Coaching Focus:** Active listening, validation, age-appropriate boundaries
- **Quests:** Quality time, emotion coaching, positive reinforcement
- **Weekly Tips:** "You validated your child's feelings 8 times this week—great authoritative parenting!"

### 5. Professional - Manager & Employee
- **Coaching Focus:** Psychological safety, feedback delivery, clarity, growth
- **Quests:** 1-on-1 meeting, growth conversation, recognition moment
- **Weekly Tips:** "Your feedback was specific and actionable. Consider adding more future-focused coaching..."

---

**End of Expansion Plan**
