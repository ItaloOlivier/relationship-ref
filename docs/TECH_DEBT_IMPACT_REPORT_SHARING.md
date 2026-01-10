# Technical Debt & Impact Report - Sharing Feature

**Date:** 2026-01-10
**Feature:** Session Report & Profile Sharing (Web Links + WhatsApp Integration)
**Scope:** Backend API + Next.js Web Viewer + Flutter UI

---

## A) TECHNICAL DEBT IDENTIFICATION

### 1. Database Schema - Incomplete Implementation ⚠️ RISKY
**Location:** `apps/api/prisma/schema.prisma` lines 201-204

**Current State:**
```prisma
model Session {
  shareToken       String?   @unique
  shareTokenExpiry DateTime?
  shareEnabled     Boolean   @default(false)
}
```

**Issue:** Fields exist but NOT used anywhere in codebase
- No service methods to generate shareToken
- No controller endpoints to create/revoke shares
- PersonalityProfile model does NOT have these fields (needs adding)

**Classification:** **BLOCKING** - Must implement service layer before UI work

**Action:** Fix in Phase 1 (Backend)

---

### 2. Share Button UI - TODO Stub 🟡 ACCEPTABLE
**Location:** `apps/mobile/lib/features/report/presentation/screens/report_screen.dart` lines 53-61

**Current State:**
```dart
IconButton(
  icon: const Icon(Icons.share),
  onPressed: () {
    // TODO: Share report
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share feature coming soon!')),
    );
  },
),
```

**Issue:** Placeholder implementation
**Classification:** **ACCEPTABLE** - Already planned, clean TODO marker

**Action:** Replace in Phase 3 (Flutter UI)

---

### 3. No Web Viewer App ⚠️ BLOCKING
**Location:** Project root (missing `/apps/web`)

**Current State:** No web application exists
**Needed:** Next.js app for public report/profile viewing

**Classification:** **BLOCKING** - Cannot share links without viewer

**Action:** Create in Phase 2 (Next.js)

---

### 4. Debug Print Statements 🟢 DEFER
**Location:** Multiple personality domain models (21 instances)

**Current State:** `avoid_print` lints in Flutter analyze
**Impact:** Development noise, minor performance hit

**Classification:** **DEFER** - Not blocking sharing feature

**Action:** Clean up in separate PR (low priority)

---

### 5. No Share Analytics Tracking ⚠️ RISKY
**Location:** Missing across all services

**Current State:** No event tracking for:
- Share link generation
- Link views
- Link expiry
- Conversion rate (viewer → signup)

**Classification:** **RISKY** - Need to measure feature success

**Action:** Implement in Phase 4 (Analytics)

---

### 6. Missing Share Event Model ⚠️ BLOCKING
**Location:** `apps/api/prisma/schema.prisma`

**Current State:** No database model for tracking share events
**Needed:** `ShareEvent` model with fields:
- sessionId or profileId
- eventType (LINK_CREATED, LINK_VIEWED, LINK_REVOKED)
- shareMethod (WHATSAPP, EMAIL, COPY_LINK)
- metadata (JSON)
- createdAt

**Classification:** **BLOCKING** - Required for Phase 4 analytics

**Action:** Add in Phase 1 (Database migration)

---

### 7. No Public API Decorator ⚠️ BLOCKING
**Location:** Missing in auth guards

**Current State:** All API routes require JWT authentication
**Needed:** `@Public()` decorator to bypass auth for share endpoints

**Classification:** **BLOCKING** - Public links won't work without this

**Action:** Create in Phase 1 (Auth infrastructure)

---

### 8. No Token Generation Utility ⚠️ BLOCKING
**Location:** Missing in utils/common

**Current State:** No cryptographically secure token generator
**Needed:** Function to generate 32-char random tokens

**Classification:** **BLOCKING** - Security requirement

**Action:** Create in Phase 1 (Utilities)

---

## B) SYSTEM IMPACT ANALYSIS

### Directly Affected Modules

| Module | Impact | Changes Required |
|--------|--------|------------------|
| **Sessions** | HIGH | Add share endpoints, sanitize report data |
| **Personality** | MEDIUM | Add share fields to schema, share endpoints |
| **Users** | LOW | Minimal - participant profile sharing |
| **Auth** | MEDIUM | Add @Public() decorator for share routes |
| **Common** | LOW | Add token generator utility |

### Indirect Dependencies

| Dependency | Impact | Notes |
|------------|--------|-------|
| **Prisma Schema** | HIGH | Migration required (ShareEvent model + PersonalityProfile fields) |
| **CI/CD** | MEDIUM | Add Next.js build job, deploy to Vercel/Railway |
| **Environment Variables** | MEDIUM | Add WEB_APP_URL, NEXT_PUBLIC_API_URL |
| **Flutter Packages** | LOW | Add `url_launcher` for WhatsApp deep links |
| **Backend Packages** | LOW | Add `nanoid` for token generation (already installed) |

### Data Impact

| Change | Type | Backward Compatible? | Risk |
|--------|------|---------------------|------|
| Add ShareEvent model | Schema | ✅ Yes (new table) | LOW |
| Add PersonalityProfile share fields | Schema | ✅ Yes (nullable) | LOW |
| Add share endpoints | API | ✅ Yes (new routes) | LOW |
| Public share viewer | API | ⚠️ Requires security review | MEDIUM |

**Migrations:**
- 1 new migration: Add `ShareEvent` model + PersonalityProfile share fields
- Zero data loss (additive only)
- No existing data modification

### Operational Impact

| Area | Impact | Notes |
|------|--------|-------|
| **Deployments** | MEDIUM | New Next.js app deployment (Vercel or Railway) |
| **Monitoring** | MEDIUM | Add share link metrics to dashboard |
| **Security** | HIGH | Public endpoints require rate limiting + token validation |
| **Performance** | LOW | Minimal - static Next.js pages with caching |
| **Costs** | LOW | Next.js hosting ~$0-20/month (Vercel free tier) |

---

## C) DECISION LOG

### 1. Incomplete Database Schema (BLOCKING)
**Decision:** Fix Now (Phase 1)
**Reason:** Cannot build service layer without proper schema
**Risk if Deferred:** Entire feature blocked
**Follow-up:** None - single migration

---

### 2. Share Button TODO Stub (ACCEPTABLE)
**Decision:** Fix Now (Phase 3)
**Reason:** Part of planned implementation
**Risk if Deferred:** None - already stubbed correctly
**Follow-up:** Replace with functional ShareDialog

---

### 3. No Web Viewer App (BLOCKING)
**Decision:** Build Now (Phase 2)
**Reason:** Core feature requirement
**Risk if Deferred:** No sharing capability
**Follow-up:** Add to monorepo structure, CI/CD

---

### 4. Debug Print Statements (DEFER)
**Decision:** Defer
**Reason:** Not blocking, cosmetic issue
**Risk if Deferred:** Minimal - development noise only
**Follow-up:** Create separate PR for code cleanup

---

### 5. No Share Analytics (RISKY)
**Decision:** Fix Now (Phase 4)
**Reason:** Need to measure feature success, ROI
**Risk if Deferred:** No data for product decisions
**Follow-up:** Build analytics dashboard

---

### 6. Missing Share Event Model (BLOCKING)
**Decision:** Fix Now (Phase 1)
**Reason:** Analytics foundation
**Risk if Deferred:** Cannot track share events
**Follow-up:** Include in same migration as PersonalityProfile

---

### 7. No Public API Decorator (BLOCKING)
**Decision:** Fix Now (Phase 1)
**Reason:** Security architecture requirement
**Risk if Deferred:** All share links fail (auth required)
**Follow-up:** Add to auth guard infrastructure

---

### 8. No Token Generation Utility (BLOCKING)
**Decision:** Fix Now (Phase 1)
**Reason:** Security requirement for share tokens
**Risk if Deferred:** Insecure tokens, guessable links
**Follow-up:** Use `nanoid` (already installed)

---

## D) OUTPUT REQUIREMENTS

### Known Technical Debt (Added to CLAUDE.md)

```markdown
## Phase 7: Sharing Feature - Technical Debt

### Pre-existing Debt
1. ✅ Database schema has unused share fields (Session model)
2. ✅ Share button is TODO stub in ReportScreen
3. ✅ No web viewer application exists
4. ⚠️ 21 debug print statements in personality models (deferred)

### New Infrastructure Needed
1. ShareEvent database model (analytics tracking)
2. @Public() decorator for auth bypass
3. Token generation utility (secure random)
4. Next.js web viewer app
5. Share analytics dashboard
```

### Impact Surface

**High Impact:**
- Sessions module (share endpoints, data sanitization)
- Prisma schema (migration required)
- Authentication (public route decorator)

**Medium Impact:**
- Personality module (share fields + endpoints)
- CI/CD (Next.js build/deploy)
- Environment configuration

**Low Impact:**
- Users module (minimal changes)
- Common utilities (token generator only)

---

## E) NO CODE CHANGES IN THIS STEP ✅

This document is assessment-only. Implementation begins in Phase Plan.
