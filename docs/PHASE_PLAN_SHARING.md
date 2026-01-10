# Phase Plan - Session Report & Profile Sharing

**Feature:** Web-based Shareable Links with WhatsApp Integration
**Estimated Duration:** 4-5 phases (3-4 weeks)
**Starting Point:** Clean `feature/individual-scorecards-and-directory` branch with 271 backend tests passing

---

## Phase Summary

| Phase | Scope | Duration | Tests | Deliverable |
|-------|-------|----------|-------|-------------|
| **1** | Backend API + Auth Infrastructure | 3-4 days | Unit + Integration | Share link generation, public endpoints |
| **2** | Next.js Web Viewer App | 4-5 days | E2E | Public report/profile viewer |
| **3** | Flutter Share UI | 3-4 days | Widget + Integration | Share dialog, WhatsApp deep links |
| **4** | Analytics & Monitoring | 2-3 days | Unit | Share event tracking, dashboard |

**Total:** 12-16 days (3-4 weeks)

---

## PHASE 1: Backend API + Auth Infrastructure

**Scope:** Database migration, share link generation, public endpoints, security infrastructure

### Tasks

#### 1.1 Database Migration
- Add `ShareEvent` model to schema
- Add share fields to `PersonalityProfile` model
- Create migration script
- Apply migration to dev database
- Verify backward compatibility

**Files:**
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/XXX_add_sharing_support.sql`

**Test Strategy:**
- Migration applies cleanly
- Existing tests still pass
- New fields queryable via Prisma

---

#### 1.2 Token Generator Utility
- Create `generateSecureToken()` using nanoid
- Add `validateShareToken()` helper
- Add rate limiting utility

**Files:**
- `apps/api/src/common/utils/token.util.ts` (new)
- `apps/api/src/common/utils/token.util.spec.ts` (new)

**Test Cases:**
- Generates 32-character tokens
- Tokens are unique (100 iterations)
- Tokens are URL-safe
- Token validation works

---

#### 1.3 Public Route Decorator
- Create `@Public()` decorator for auth bypass
- Update JWT auth guard to check for decorator
- Add to common decorators

**Files:**
- `apps/api/src/common/decorators/public.decorator.ts` (new)
- `apps/api/src/common/guards/jwt-auth.guard.ts` (update)

**Test Cases:**
- Public routes skip JWT validation
- Protected routes still require JWT
- Decorator metadata correctly set

---

#### 1.4 Sessions Share Service
- Add `createShareLink()` method
- Add `getSharedReport()` method (public, sanitized)
- Add `revokeShareLink()` method
- Add data sanitization logic (no audio, no full transcript)

**Files:**
- `apps/api/src/sessions/sessions.service.ts` (update)
- `apps/api/src/sessions/dto/create-share-link.dto.ts` (new)
- `apps/api/src/sessions/dto/shared-report.dto.ts` (new)
- `apps/api/src/sessions/sessions.service.spec.ts` (update)

**Test Cases:**
- Creates valid share token
- Sets expiry correctly (7/14/30 days)
- Sanitizes sensitive data (audio, transcript)
- Revokes links successfully
- Expired links return 404

---

#### 1.5 Sessions Share Controller
- Add `POST /sessions/:id/share` endpoint
- Add `GET /share/report/:token` endpoint (public)
- Add `DELETE /sessions/:id/share` endpoint
- Add Swagger documentation

**Files:**
- `apps/api/src/sessions/sessions.controller.ts` (update)
- `apps/api/src/sessions/sessions.controller.spec.ts` (update)

**Test Cases:**
- Authenticated user can create share link
- Public endpoint returns sanitized report
- Expired tokens return 404 (not 403)
- Invalid tokens return 404
- Revoke endpoint works

---

#### 1.6 Personality Share Service & Controller
- Add share methods to `PersonalityService`
- Add share endpoints to `PersonalityController`
- Sanitize personality data (relationship-scoped only)

**Files:**
- `apps/api/src/personality/personality.service.ts` (update)
- `apps/api/src/personality/personality.controller.ts` (update)
- `apps/api/src/personality/dto/create-share-link.dto.ts` (new)

**Test Cases:**
- Creates personality profile share link
- Public profile endpoint works
- Data scoped to selected relationship
- No cross-relationship data leakage

---

#### 1.7 Share Events Tracking
- Create `ShareEventsService`
- Add `trackShareEvent()` method
- Add database writes for analytics

**Files:**
- `apps/api/src/share-events/share-events.service.ts` (new)
- `apps/api/src/share-events/share-events.module.ts` (new)
- `apps/api/src/share-events/share-events.service.spec.ts` (new)

**Test Cases:**
- Logs LINK_CREATED events
- Logs LINK_VIEWED events
- Logs LINK_REVOKED events
- Stores metadata (user agent, referer)

---

### Phase 1 Test Summary
- **Unit Tests:** 15+ new tests
- **Integration Tests:** 8+ endpoint tests
- **Total New Tests:** 23+
- **Success Criteria:** All 294+ tests passing

### Phase 1 Deliverables
1. ✅ Database migration applied
2. ✅ Share link generation API working
3. ✅ Public report endpoint functional
4. ✅ Share events tracked
5. ✅ All tests passing

### Phase 1 Commit & Push
```bash
git add .
git commit -m "Phase 1: Backend share link generation API

- Add ShareEvent model + PersonalityProfile share fields
- Add @Public() decorator for auth bypass
- Add token generation utility (nanoid)
- Add Sessions share endpoints (create/get/revoke)
- Add Personality share endpoints
- Add ShareEventsService for analytics tracking
- Add 23 new tests (294 total passing)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin feature/individual-scorecards-and-directory
```

---

## PHASE 2: Next.js Web Viewer App

**Scope:** Create standalone Next.js app for public report/profile viewing

### Tasks

#### 2.1 Next.js Project Setup
- Create `apps/web` directory
- Initialize Next.js 15 with TypeScript
- Add Tailwind CSS
- Configure environment variables

**Files:**
- `apps/web/package.json` (new)
- `apps/web/next.config.ts` (new)
- `apps/web/tailwind.config.ts` (new)
- `apps/web/.env.example` (new)

**Test:** `npm run build` succeeds

---

#### 2.2 Shared Report Viewer Page
- Create `/share/report/[token]` dynamic route
- Fetch data from `GET /share/report/:token` API
- Render session report (score, cards, coaching)
- Add Open Graph meta tags for WhatsApp previews
- Mobile-responsive design

**Files:**
- `apps/web/app/share/report/[token]/page.tsx` (new)
- `apps/web/components/ReportCard.tsx` (new)
- `apps/web/components/ScoreGauge.tsx` (new)
- `apps/web/lib/api-client.ts` (new)

**Test Cases:**
- Valid token renders report
- Invalid token shows 404
- Expired token shows 404
- Mobile responsive (viewport tests)
- Open Graph tags present

---

#### 2.3 Shared Profile Viewer Page
- Create `/share/profile/[token]` dynamic route
- Fetch data from `GET /personality/share/:token` API
- Render personality profile (traits, attachment, metrics)
- Mobile-responsive design

**Files:**
- `apps/web/app/share/profile/[token]/page.tsx` (new)
- `apps/web/components/TraitGauge.tsx` (new)
- `apps/web/components/AttachmentStyleCard.tsx` (new)

**Test Cases:**
- Valid token renders profile
- Invalid token shows 404
- Relationship-scoped data only
- Mobile responsive

---

#### 2.4 Error Pages & Loading States
- Create custom 404 page
- Add loading skeletons
- Add error boundary

**Files:**
- `apps/web/app/not-found.tsx` (new)
- `apps/web/components/ReportSkeleton.tsx` (new)
- `apps/web/app/error.tsx` (new)

**Test:** Error states render correctly

---

#### 2.5 SEO & Performance Optimization
- Add Open Graph meta tags
- Add Twitter Card meta tags
- Configure caching headers
- Add analytics (Vercel Analytics or Google Analytics)

**Files:**
- `apps/web/app/layout.tsx` (update)
- `apps/web/middleware.ts` (new - caching)

**Test:** Lighthouse score >90

---

#### 2.6 Deployment Configuration
- Configure Vercel/Railway deployment
- Add environment variables
- Set up custom domain (optional)

**Files:**
- `apps/web/vercel.json` or `railway.json` (new)
- `.github/workflows/ci.yml` (update - add Next.js build job)

**Test:** Deploy to staging, verify works

---

### Phase 2 Test Summary
- **E2E Tests:** Playwright tests for both viewers
- **Unit Tests:** Component tests (Jest/Vitest)
- **Success Criteria:** Both viewers functional, deployed to staging

### Phase 2 Deliverables
1. ✅ Next.js app deployed to Vercel/Railway
2. ✅ Report viewer page functional
3. ✅ Profile viewer page functional
4. ✅ Mobile responsive
5. ✅ Open Graph previews working

### Phase 2 Commit & Push
```bash
git add .
git commit -m "Phase 2: Next.js web viewer for shared reports/profiles

- Create Next.js 15 app with TypeScript + Tailwind
- Add /share/report/[token] viewer page
- Add /share/profile/[token] viewer page
- Add Open Graph meta tags for WhatsApp previews
- Mobile-responsive design
- Deploy to Vercel staging

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin feature/individual-scorecards-and-directory
```

---

## PHASE 3: Flutter Share UI Integration

**Scope:** Replace TODO share button with functional share dialog + WhatsApp integration

### Tasks

#### 3.1 Add url_launcher Package
- Add `url_launcher` to pubspec.yaml
- Update iOS/Android permissions

**Files:**
- `apps/mobile/pubspec.yaml` (update)
- `apps/mobile/ios/Runner/Info.plist` (update - LSApplicationQueriesSchemes)
- `apps/mobile/android/app/src/main/AndroidManifest.xml` (update - queries)

**Test:** `flutter pub get` succeeds

---

#### 3.2 Share Service
- Create `ShareService` for API calls
- Add `createShareLink()` method
- Add `revokeShareLink()` method
- Add WhatsApp deep link helper

**Files:**
- `apps/mobile/lib/core/services/share_service.dart` (new)
- `apps/mobile/lib/core/services/share_service_test.dart` (new)

**Test Cases:**
- Creates share link via API
- Revokes share link
- Generates WhatsApp URL correctly

---

#### 3.3 Share Dialog Widget
- Create `ShareDialog` component
- Add privacy options (anonymize, expiry selector)
- Add share methods (WhatsApp, Copy Link, Email)
- Add loading/error states

**Files:**
- `apps/mobile/lib/features/share/presentation/widgets/share_dialog.dart` (new)
- `apps/mobile/lib/features/share/presentation/widgets/share_dialog_test.dart` (new)

**Test Cases:**
- Dialog renders correctly
- Privacy options toggle
- Share methods work
- Loading states display
- Error handling works

---

#### 3.4 Update ReportScreen Share Button
- Replace TODO stub with functional ShareDialog call
- Pass sessionId to dialog
- Handle share success/error

**Files:**
- `apps/mobile/lib/features/report/presentation/screens/report_screen.dart` (update)

**Test:** Share button opens dialog, creates link

---

#### 3.5 Add Share to Profile Screens
- Add share button to PersonalityProfileScreen
- Add share button to ParticipantProfileScreen
- Use same ShareDialog component

**Files:**
- `apps/mobile/lib/features/personality/presentation/screens/personality_profile_screen.dart` (update)
- `apps/mobile/lib/features/relationship/presentation/screens/participant_profile_screen.dart` (update)

**Test:** Share buttons functional on all screens

---

#### 3.6 Manage Shared Links Screen
- Create "Manage Shared Links" settings screen
- List active share links
- Show expiry dates
- Add revoke button

**Files:**
- `apps/mobile/lib/features/settings/presentation/screens/manage_shared_links_screen.dart` (new)
- `apps/mobile/lib/core/router/app_router.dart` (update - add route)

**Test Cases:**
- Lists active links
- Shows correct expiry
- Revoke button works
- Refresh updates list

---

### Phase 3 Test Summary
- **Widget Tests:** 6+ new widget tests
- **Integration Tests:** 3+ screen integration tests
- **Success Criteria:** Share flow works end-to-end

### Phase 3 Deliverables
1. ✅ Share dialog functional
2. ✅ WhatsApp deep linking works
3. ✅ Copy link works
4. ✅ Manage links screen works
5. ✅ All Flutter tests passing

### Phase 3 Commit & Push
```bash
git add .
git commit -m "Phase 3: Flutter share UI integration

- Add url_launcher package for WhatsApp deep links
- Create ShareService for API calls
- Create ShareDialog component with privacy options
- Replace TODO share button with functional implementation
- Add share to personality/participant profile screens
- Add Manage Shared Links settings screen
- Add 9 new widget tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin feature/individual-scorecards-and-directory
```

---

## PHASE 4: Analytics & Monitoring

**Scope:** Share event tracking, analytics dashboard, monitoring

### Tasks

#### 4.1 Share Analytics Service
- Create `ShareAnalyticsService`
- Add methods for:
  - Share rate (% of sessions shared)
  - Link open rate
  - Conversion rate (viewer → signup)
  - Popular share methods

**Files:**
- `apps/api/src/share-events/share-analytics.service.ts` (new)
- `apps/api/src/share-events/share-analytics.service.spec.ts` (new)

**Test Cases:**
- Calculates share rate correctly
- Aggregates by share method
- Handles date ranges

---

#### 4.2 Analytics API Endpoints
- Add `GET /share-events/analytics` endpoint
- Add query params (startDate, endDate, groupBy)
- Return aggregated metrics

**Files:**
- `apps/api/src/share-events/share-events.controller.ts` (new)
- `apps/api/src/share-events/share-events.controller.spec.ts` (new)

**Test Cases:**
- Returns correct aggregations
- Date filtering works
- Requires authentication

---

#### 4.3 Rate Limiting on Public Endpoints
- Add throttling to share viewer endpoints
- Limit: 100 views per token per day
- Prevent abuse

**Files:**
- `apps/api/src/sessions/sessions.controller.ts` (update)
- `apps/api/src/personality/personality.controller.ts` (update)

**Test:** Rate limit triggers after 100 requests

---

#### 4.4 Monitoring & Logging
- Add structured logging for share events
- Add Sentry error tracking (if not already present)
- Add performance monitoring

**Files:**
- `apps/api/src/common/interceptors/logging.interceptor.ts` (update)

**Test:** Logs appear in console/Sentry

---

#### 4.5 Share Analytics Dashboard (Optional)
- Add share metrics widget to admin dashboard
- Display share rate, link opens, top sessions

**Files:**
- `apps/mobile/lib/features/admin/presentation/widgets/share_metrics_widget.dart` (new)

**Test:** Widget displays correct metrics

---

### Phase 4 Test Summary
- **Unit Tests:** 5+ new tests
- **Integration Tests:** 3+ endpoint tests
- **Success Criteria:** Analytics working, rate limiting functional

### Phase 4 Deliverables
1. ✅ Share analytics API functional
2. ✅ Rate limiting on public endpoints
3. ✅ Logging/monitoring active
4. ✅ All tests passing

### Phase 4 Commit & Push
```bash
git add .
git commit -m "Phase 4: Share analytics & monitoring

- Add ShareAnalyticsService for metrics aggregation
- Add /share-events/analytics API endpoint
- Add rate limiting on public share viewer endpoints
- Add structured logging for share events
- Add 8 new tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin feature/individual-scorecards-and-directory
```

---

## FINALIZATION

### Tasks
1. Update CLAUDE.md with Phase 7 completion
2. Update README.md with sharing feature
3. Create user documentation (how to share reports)
4. Create PR for review
5. Merge to main

### Final Deliverables
- [ ] All 310+ tests passing (backend + mobile)
- [ ] CI/CD green
- [ ] Documentation updated
- [ ] Feature deployed to staging
- [ ] PR merged to main

---

## Risk Mitigation by Phase

| Phase | Risk | Mitigation |
|-------|------|------------|
| 1 | Migration fails | Test on dev DB first, have rollback script |
| 1 | Auth bypass broken | Extensive @Public() decorator tests |
| 2 | Next.js deployment issues | Deploy to staging early, test thoroughly |
| 2 | Open Graph previews don't work | Test in WhatsApp before deploy |
| 3 | WhatsApp deep links broken | Test on real devices (iOS + Android) |
| 3 | Share dialog UX confusing | User testing before finalization |
| 4 | Rate limiting too aggressive | Start with high limits, tune down |
| 4 | Analytics slow | Add database indexes on shareToken, createdAt |

---

## Debt Items Mapped to Phases

| Debt Item | Phase | Status |
|-----------|-------|--------|
| Unused share DB fields | 1 | BLOCKING |
| TODO share button | 3 | ACCEPTABLE |
| No web viewer | 2 | BLOCKING |
| Debug print statements | - | DEFERRED |
| No share analytics | 4 | RISKY |
| Missing ShareEvent model | 1 | BLOCKING |
| No @Public() decorator | 1 | BLOCKING |
| No token generator | 1 | BLOCKING |

---

## Success Metrics (Post-Launch)

**3 Months Post-Launch:**
- Share rate: ≥30% of completed sessions
- Link open rate: ≥60% of generated links
- Conversion rate: ≥10% of link viewers sign up
- Average link lifetime: 5-7 days (before expiry)
- User satisfaction: ≥4.5/5 stars (sharing feature)

---

## Notes

- All phases are sequential (no parallelization)
- Each phase ends with commit + push
- All tests must pass before moving to next phase
- No silent refactors - all changes documented
