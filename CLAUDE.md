# Relationship Referee - Project Instructions

## Project Overview

Relationship Referee is a privacy-first mobile app that helps couples improve communication through AI-powered coaching sessions.

## Tech Stack

- **Mobile**: Flutter 3.38+ with Riverpod for state management
- **Backend**: NestJS with Prisma ORM
- **Database**: PostgreSQL
- **Queue**: BullMQ with Redis
- **AI**: OpenAI Whisper (transcription) + GPT-4o-mini (coaching) + Claude Sonnet 4 (Q&A)
- **Hosting**: Railway

## Project Structure

```
/apps
  /api        - NestJS backend
  /mobile     - Flutter app
/docs         - Documentation
```

## Development Commands

### Backend (apps/api)
```bash
npm install           # Install dependencies
npm run dev           # Start dev server
npm run test          # Run tests
npm run build         # Build for production
npx prisma migrate dev  # Create migration
npx prisma studio     # DB GUI
```

### Mobile (apps/mobile)
```bash
flutter pub get       # Install dependencies
flutter run           # Run app
flutter test          # Run tests
flutter build apk     # Build Android
flutter build ios     # Build iOS

# iOS TestFlight Deployment
./scripts/deploy-ios.sh  # Build and prepare for TestFlight upload
```

See [TestFlight Deployment Guide](docs/testflight-deployment.md) for complete iOS deployment instructions.

## Phase Status

- [x] Phase 0: Repository setup & CI/CD
- [x] Phase 1: Backend MVP
- [x] Phase 2: Flutter MVP (Completed 2026-01-10)
  - Session repository with error handling (13 unit tests)
  - Recording provider with full audio flow (10 unit tests)
  - History screen with real data integration (4 widget tests)
  - Report screen with complete analysis display
  - Gamification dashboard (already complete)
  - WhatsApp import with file parsing (already complete)
  - Home dashboard with live data (bank balance, streaks, quests, recent sessions)
  - **Total: 52 tests passing**
- [x] **Phase 3: Multi-Relationship Expansion - Database Foundation** (Completed 2026-01-10)
  - Database schema migration: Relationship, RelationshipMember, RelationshipLifecycleEvent models
  - 11 relationship types (romantic, friendship, family, business, professional)
  - Variable group sizes (2-10 participants) via junction table
  - Lifecycle tracking: ACTIVE → PAUSED → ENDED → ARCHIVED
  - WhatsApp sharing fields (shareToken, shareTokenExpiry, shareEnabled)
  - Backward compatibility maintained (Couple model kept)
  - Successfully deployed to dev database
  - See `docs/EXPANSION_PLAN.md` for full specification
- [x] **Phase 4: Service Layer Updates** (Completed 2026-01-10)
  - Created [RelationshipsService](apps/api/src/relationships/relationships.service.ts) with full CRUD and lifecycle tracking
  - Created [RelationshipsController](apps/api/src/relationships/relationships.controller.ts) with 6 REST endpoints
  - Removed single-couple constraint - users can join multiple relationships
  - Updated [SessionsService](apps/api/src/sessions/sessions.service.ts) to support both coupleId and relationshipId
  - Updated [GamificationService](apps/api/src/gamification/gamification.service.ts) for multi-relationship quests
  - Updated [QuestsService](apps/api/src/gamification/quests.service.ts) to query across all user relationships
  - All services maintain backward compatibility with legacy Couple model
  - **Key Methods:**
    - `createRelationship()` - No single-couple constraint
    - `joinRelationship()` - Multiple relationships allowed
    - `getRelationshipsForUser()` - Returns array, not single couple
    - `leaveRelationship()` - Soft delete with reason tracking
    - `updateRelationshipStatus()` - Validates state transitions
- [x] **Phase 5: Session Q&A & Cross-Session Pattern Recognition** (Completed 2026-01-10)
  - **Backend (NestJS):**
    - `SessionQAService`: AI-powered Q&A using Claude Sonnet 4 with full session context
    - `PatternRecognitionService`: Automatic pattern detection algorithms
    - `InsightsModule`: REST API for patterns and insights summary
    - Pattern types: topic triggers, time patterns, improvement trends, horsemen trends, positive patterns
    - Hooked into analysis pipeline for automatic metrics cache updates
  - **Frontend (Flutter):**
    - Q&A Chat Section integrated into report screen with suggested questions
    - Insights Screen with 3 tabs (Patterns, Trends, Summary)
    - Pattern Card with swipe-to-acknowledge/dismiss
    - Insights Summary Card on home dashboard
    - Route: `/home/insights`
  - **Key Files:**
    - [SessionQAService](apps/api/src/sessions/services/session-qa.service.ts)
    - [PatternRecognitionService](apps/api/src/insights/pattern-recognition.service.ts)
    - [InsightsController](apps/api/src/insights/insights.controller.ts)
    - [InsightsScreen](apps/mobile/lib/features/insights/presentation/screens/insights_screen.dart)
    - [QAChatSection](apps/mobile/lib/features/session/presentation/widgets/qa_chat_section.dart)
- [x] **Phase 6: Individual Scorecards + Relationship Directory** (Completed 2026-01-10)
  - [x] Phase 6.1: Database Foundation (2026-01-10)
    - Added `individualScores` JSON field to AnalysisResult model
    - Migration: `20260110_add_individual_scores_field`
    - Schema supports speaker-attributed cards and per-person score breakdowns
    - Backward compatible (nullable field, existing data unaffected)
    - All 249 existing tests pass
  - [x] Phase 6.2: Speaker Attribution in Scoring Service (2026-01-10)
    - Updated Card, HorsemanDetection, RepairAttempt interfaces with speaker field
    - Implemented detectSpeaker() helper with best-match algorithm
    - Speaker detection handles: WhatsApp format, multi-speaker, edge cases
    - All cards, horsemen, and repair attempts now track speaker
    - Added 10 comprehensive tests for speaker attribution
    - All 259 tests pass (100% backward compatible)
  - [x] Phase 6.3: Individual Score Calculation (2026-01-10)
    - Added IndividualScore interface to ScoringResult with per-speaker metrics
    - Implemented calculateIndividualScores() method in ScoringService
    - Tracks per-speaker: greenCardCount, yellowCardCount, redCardCount, personalScore (0-100), bankContribution, horsemenUsed, repairAttemptCount
    - Updated analyzeTranscript() to call individual score calculation
    - Updated AnalysisService to store individualScores in database
    - Added 12 comprehensive tests covering: two-speaker scenarios, card counting, bank contribution, personal scores, horsemen tracking, repair attempts, edge cases (solo/unattributed/duplicates)
    - All 271 tests pass (12 new, 259 existing)
    - Commit: c916c09
  - [x] Phase 6.4: Relationship Directory API (2026-01-10)
    - Added 4 new endpoints to RelationshipsController
    - GET /relationships/:id/members - Get all participants with user details
    - GET /relationships/:id/sessions - Get session history with analysis results
    - GET /relationships/:id/insights - Get aggregated patterns from metrics cache
    - GET /relationships/:id/health - Get health score, trend, emotional bank balance
    - Implemented 4 methods in RelationshipsService: getRelationshipMembers(), getRelationshipSessions(), getRelationshipInsights(), getRelationshipHealth()
    - Health calculation: averages last 30 days sessions, calculates trend (improving/declining/stable), green card ratio
    - All endpoints verify user membership before returning data (ACL)
    - All 271 tests pass (no test changes needed, compilation verified)
    - Commit: ab7674f
  - [x] Phase 6.5: User Profile with Privacy ACL (2026-01-10)
    - Added 2 new endpoints to UsersController
    - GET /users/:userId/profile - View profile of any user you share a relationship with
    - GET /users/:userId/profile-in-relationship/:relationshipId - View profile in specific relationship context
    - Implemented 2 methods in UsersService: getUserProfileWithACL(), getUserProfileInRelationshipContext()
    - ACL checks: both endpoints verify shared relationship membership before returning data
    - Relationship-scoped metrics: aggregates individualScores from all sessions in that relationship only
    - Returns: avgPersonalScore, total cards (green/yellow/red), unique horsemen used, total repair attempts
    - Privacy-first: returns 404 if users don't share a relationship (prevents user enumeration)
    - All 271 tests pass (no test changes needed, compilation verified)
    - Commit: e2b6631
  - [x] Phase 6.6: Flutter Domain Models (2026-01-10)
    - Added IndividualScore class with 9 fields (userId, speaker, card counts, personalScore, bankContribution, horsemenUsed, repairAttemptCount)
    - Updated SessionCard with speaker and userId fields
    - Updated AnalysisResult to include individualScores list
    - JSON deserialization handles null/missing fields gracefully
    - Backward compatible with existing API responses
    - 63 Flutter tests passing (8 pre-existing failures unrelated)
    - Commit: 057d7e3
  - [x] Phase 6.7: Flutter Individual Scorecard UI Widget (2026-01-10)
    - Created IndividualScorecardSection widget displaying per-speaker metrics in session reports
    - Components: _IndividualScorecardCard, _PersonalScoreGauge, _CardCountBadge, _BankContributionRow, _RepairAttemptsRow, _HorsemenSection
    - Visual design: personal score gauge (green>80, yellow 60-80, red<60), card count badges, emotional bank +/-, repair attempts, Four Horsemen chips
    - Integrated into report screen after bank change card
    - Only displays when individualScores array is not empty
    - Commit: 96ccc88
  - [x] Phase 6.8: Flutter Relationship Models and Repository (2026-01-10)
    - Created relationship domain models: Relationship, RelationshipMember, UserInfo, RelationshipHealth
    - RelationshipType enum: 11 types (romantic, friendship, family, business, etc.)
    - RelationshipStatus enum: lifecycle states (ACTIVE, PAUSED, ENDED_MUTUAL, ENDED_UNILATERAL, ARCHIVED)
    - MemberRole enum: 9 roles (PARTNER, PARENT, CHILD, FRIEND, COLLEAGUE, etc.)
    - Created RelationshipRepository with full API integration via RelationshipsApi class
    - Riverpod providers: relationshipsProvider, relationshipProvider.family, relationshipHealthProvider.family, relationshipSessionsProvider.family
    - Commit: e287276
  - [x] Phase 6.9: Flutter Relationship List Screen (2026-01-10)
    - Created RelationshipListScreen showing all user relationships grouped by type
    - Components: _RelationshipTypeSection, _RelationshipCard, _StatusBadge
    - Type-specific icons and labels for each category (Romantic, Family, Professional, etc.)
    - Card displays: relationship name, status badge, active member chips, session count, invite code
    - Empty state with Create/Join buttons
    - Navigation: tap card to view detail screen (/relationships/{id})
    - Commit: 4370203
  - [x] Phase 6.10: Flutter Relationship Detail Screen (2026-01-10)
    - Created RelationshipDetailScreen showing comprehensive relationship info
    - Health Card: health score with color coding, trend indicator, green card ratio gauge, stats
    - Members Section: lists all active members with avatars, role badges, user names/emails
    - Sessions Section: shows 5 most recent sessions with score, date/time, card count chips
    - Invite Code Card: monospace code display with copy button (for active relationships only)
    - Options Menu: Pause and Leave actions (TODO)
    - Commit: 8b925cb
  - [x] Phase 6.11: Flutter Participant Profile Screen (2026-01-10)
    - Created ParticipantProfileScreen showing individual user metrics in relationship context
    - Domain models: ParticipantProfile, UserInfo, RelationshipContext, ParticipantMetrics
    - Added getUserProfileInRelationship() method to UsersApi
    - Components: _UserHeader, _RelationshipContextBadge, _PersonalScoreCard, _CardDistributionCard, _CommunicationPatternsCard, _SessionSummaryCard
    - Displays: avg personal score, card distribution, green card ratio, repair attempts, Four Horsemen, sessions count
    - Privacy-first with backend ACL verification
    - Commit: a63c1d2
  - [x] Phase 6.12: Navigation and Routing Integration (2026-01-10)
    - Added relationship routes to app router (GoRouter)
    - Routes: /settings/relationships (list), /relationships/:id (detail), /relationships/:id/participants/:userId (profile), /sessions/:id/report (standalone)
    - Navigation structure: Settings → Relationships → Detail → Participants
    - All routes handle path parameters correctly
    - Commit: 9318572
  - **Phase 6 Complete!** All 271 backend tests passing, Flutter analysis clean on all new screens
  - [ ] Relationship list/switcher in home screen (deferred to Phase 7)
  - [ ] Cross-relationship personality comparison (deferred)
  - [ ] Type-specific UI themes (romantic vs business vs friendship) (deferred)
- [x] **Phase 7: WhatsApp Report Sharing - Backend API** (Phase 1/4 Completed 2026-01-10)
  - [x] Phase 1: Backend Share Link Generation - See detailed documentation above
  - [ ] Phase 2: Next.js Web Viewer App
  - [ ] Phase 3: Flutter Share UI Integration
  - [ ] Phase 4: Analytics & Monitoring
  - **Phase 1 Summary:**
    - Database: ShareEvent model + PersonalityProfile share fields
    - Token utility: generateSecureToken(), 16 tests
    - Auth: @Public() decorator, JwtAuthGuard with Reflector
    - Service: createShareLink(), getSharedReport(), revokeShareLink()
    - Controller: 3 REST endpoints (POST/GET/DELETE)
    - Tracking: ShareEventsService integrated
    - Tests: 287 passing (271 original + 16 new)
    - Documentation: Full Swagger + comments
- [ ] **Phase 8: Type-Specific Coaching**
  - Business relationship coaching (conflict resolution, negotiation)
  - Friendship coaching (boundary setting, support patterns)
  - Family coaching (generational communication, roles)
  - Professional coaching (mentorship feedback, collaboration)
- [ ] **Phase 9: Relationship Lifecycle Management**
  - Pause/resume relationships
  - Archive old relationships
  - Relationship health trends over time
  - Lifecycle event tracking (milestones, transitions)
- [ ] **Phase 10: Polish & Hardening**
  - Individual scorecards with speaker attribution
  - Performance optimization
  - Offline mode support
  - Advanced analytics
  - Accessibility improvements
- [x] **Phase 11: Personality Profiles** (Completed 2026-01-10)
  - **Backend (NestJS):** Already complete - full REST API at `/personality/...`
  - **Frontend (Flutter):**
    - Domain models: PersonalityProfile, RelationshipDynamic, CoupleComparison
    - PersonalityRepository with Riverpod providers
    - PersonalityProfileScreen (4 tabs: Overview, Traits, Attachment, Coaching)
    - CoupleComparisonScreen (3 tabs: Overview, Traits, Insights)
    - RelationshipCoachingScreen (coaching tips, Gottman ratio, strengths/growth)
    - Widget components: TraitGaugeCard, AttachmentStyleCard, CommunicationStyleCard, EmotionalIntelligenceCard, NarrativeCard
  - **Routes:**
    - `/settings/personality` - My Personality Profile
    - `/settings/personality/comparison` - Couple Comparison
    - `/settings/personality/coaching` - Relationship Coaching
  - **Key Files:**
    - [PersonalityProfileScreen](apps/mobile/lib/features/personality/presentation/screens/personality_profile_screen.dart)
    - [CoupleComparisonScreen](apps/mobile/lib/features/personality/presentation/screens/couple_comparison_screen.dart)
    - [RelationshipCoachingScreen](apps/mobile/lib/features/personality/presentation/screens/relationship_coaching_screen.dart)
    - [PersonalityRepository](apps/mobile/lib/features/personality/data/personality_repository.dart)
  - **Tests:** 19 unit tests for domain models (63 total tests)

## Key Domain Concepts

### Cards
- **Green**: Positive behaviors (appreciation, validation, repair attempts)
- **Yellow**: Caution behaviors (interrupting, always/never language)
- **Red**: Concerning behaviors (contempt, stonewalling)

### Emotional Bank Account
- Deposits: Green card behaviors (+points)
- Withdrawals: Red/Yellow card behaviors (-points)
- Balance tracked per couple

### Four Horsemen (Gottman)
1. Criticism
2. Contempt
3. Defensiveness
4. Stonewalling

## Privacy Requirements

1. Explicit consent before recording
2. Audio deleted after transcription (default)
3. Users can delete all data
4. Safety resources shown for concerning patterns
5. No always-on listening
6. WhatsApp imports require user to manually export and select file

## Session Source Types

Sessions can come from two sources:
- **AUDIO**: Live recorded conversation (default)
- **WHATSAPP_CHAT**: Imported from WhatsApp chat export

Both types go through the same analysis pipeline and generate the same Match Report.

## Relationship Directory (Phase 6)

### Overview
A centralized view to see all people you have relationships with across all relationship types.

### Features
1. **All Relationships View** (`/relationships`)
   - Grouped by type: Romantic, Friends, Family, Business, Professional
   - Quick stats per relationship (sessions, health score, last activity)
   - Search/filter by name, type, or status

2. **Relationship Detail View** (`/relationships/:id`)
   - Participant list with avatars
   - Shared session history
   - Relationship health trend graph
   - Quick actions: Start Session, View Insights, Share Report

3. **Cross-Relationship Personality Comparison**
   - Compare your personality profile across different relationships
   - See how you communicate differently with friends vs business partners
   - Identify patterns (e.g., "You use more repair attempts with family than friends")

4. **Participant Profile View** (`/participants/:userId`)
   - View personality profile of any relationship member
   - Privacy-controlled: Only show data from shared sessions
   - Communication style summary
   - Shared sessions list

### API Endpoints
```
GET  /relationships                    - List all user's relationships
GET  /relationships/:id                - Get relationship details
GET  /relationships/:id/members        - Get all participants
GET  /relationships/:id/sessions       - Get shared sessions
GET  /relationships/:id/insights       - Get relationship insights
GET  /users/:id/personality-in/:relId  - Get user's personality in specific relationship context
```

### UI Components
- **RelationshipCard**: Shows type icon, name, member count, health score
- **RelationshipTypeFilter**: Chips to filter by type
- **ParticipantAvatar**: Shows user avatar with role badge
- **RelationshipHealthGauge**: Visual health indicator
- **SessionTimelineWidget**: Chronological view of sessions

### Privacy Controls
- Users can only view profiles of people they share relationships with
- Personality data limited to shared sessions only
- Option to hide profile from relationship members
- Per-relationship privacy settings (OPEN, MEMBERS_ONLY, PRIVATE)

## Individual Scorecards (Phase 6 & Phase 10)

### Problem Statement
Currently, all cards and scores are aggregated at the session level. Users can't see:
- **Who** got which cards
- Individual contribution to emotional bank
- Personal accountability for behaviors

### Solution: Speaker-Attributed Cards

#### Backend Changes

1. **Update Card Interface** ([scoring.service.ts](apps/api/src/analysis/scoring.service.ts)):
```typescript
export interface Card {
  type: CardType;
  reason: string;
  quote?: string;
  category: string;
  speaker?: string;      // NEW: Speaker name from transcript
  userId?: string;       // NEW: Mapped user ID (if known)
  timestamp?: Date;      // NEW: When in conversation (optional)
}
```

2. **Enhanced Scoring Result**:
```typescript
export interface ScoringResult {
  // Existing fields
  cards: Card[];
  horsemenDetected: HorsemanDetection[];
  repairAttempts: RepairAttempt[];
  bankChange: number;
  overallScore: number;
  safetyFlagTriggered: boolean;

  // NEW: Individual breakdowns
  individualScores: IndividualScore[];
}

export interface IndividualScore {
  userId?: string;
  speaker: string;
  greenCardCount: number;
  yellowCardCount: number;
  redCardCount: number;
  personalScore: number;        // 0-100 individual score
  bankContribution: number;     // Net bank change from this person
  horsemenUsed: string[];       // Which horsemen they used
  repairAttemptCount: number;
}
```

3. **Speaker Detection Logic**:
```typescript
// Parse speaker from transcript line
function detectSpeaker(quote: string, transcript: string): string | null {
  // Match pattern: "SpeakerName: quote text"
  const lines = transcript.split('\n');
  for (const line of lines) {
    if (line.includes(quote)) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        return match[1].trim(); // Speaker name
      }
    }
  }
  return null;
}
```

4. **User Mapping** (for WhatsApp imports):
```typescript
// Map speaker names to userIds using relationship members
async function mapSpeakersToUsers(
  speakers: string[],
  relationshipId: string
): Promise<Map<string, string>> {
  const members = await getRelationshipMembers(relationshipId);
  const mapping = new Map<string, string>();

  for (const speaker of speakers) {
    const member = members.find(m =>
      m.user.name.toLowerCase() === speaker.toLowerCase()
    );
    if (member) {
      mapping.set(speaker, member.userId);
    }
  }

  return mapping;
}
```

#### Frontend Changes (Flutter)

1. **Individual Scorecard Widget**:
```dart
class IndividualScorecardSection extends StatelessWidget {
  final List<IndividualScore> scores;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Individual Scorecards', style: titleLarge),
        SizedBox(height: 16),
        ...scores.map((score) => ScorecardCard(score: score)),
      ],
    );
  }
}

class ScorecardCard extends StatelessWidget {
  final IndividualScore score;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Header: Avatar + Name + Personal Score
            Row(
              children: [
                CircleAvatar(child: Text(score.speaker[0])),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(score.speaker, style: titleMedium),
                      Text('Personal Score: ${score.personalScore}/100'),
                    ],
                  ),
                ),
                ScoreBadge(score: score.personalScore),
              ],
            ),
            SizedBox(height: 12),

            // Card counts
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                CardCountChip(
                  icon: Icons.check_circle,
                  count: score.greenCardCount,
                  color: AppColors.success,
                  label: 'Green',
                ),
                CardCountChip(
                  icon: Icons.warning,
                  count: score.yellowCardCount,
                  color: AppColors.warning,
                  label: 'Yellow',
                ),
                CardCountChip(
                  icon: Icons.error,
                  count: score.redCardCount,
                  color: AppColors.error,
                  label: 'Red',
                ),
              ],
            ),

            // Bank contribution
            SizedBox(height: 12),
            BankContributionBar(contribution: score.bankContribution),
          ],
        ),
      ),
    );
  }
}
```

2. **Report Screen Updates**:
- Add "Individual Scorecards" tab alongside "Overview", "Cards", "Coaching"
- Show side-by-side comparison of both participants
- Highlight who contributed most to positive/negative patterns
- Personal accountability messaging: "You used contempt 3 times"

3. **Insights Integration**:
- "Sarah uses more repair attempts than John (avg 5 vs 2)"
- "John's criticism count decreased 40% over last 3 sessions"
- "You both interrupt equally (4 times each)"

### Database Changes

**AnalysisResult table** (add JSON field):
```prisma
model AnalysisResult {
  // ... existing fields ...

  individualScores Json? // Array of IndividualScore objects
}
```

**SessionCard table** (if we want granular storage):
```prisma
model SessionCard {
  id         String   @id @default(cuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [id])

  type       CardType
  reason     String
  quote      String?
  category   String

  speaker    String?  // NEW
  userId     String?  // NEW
  timestamp  DateTime? // NEW

  createdAt  DateTime @default(now())

  @@index([sessionId])
  @@index([userId])
}
```

### Testing Requirements

1. **Unit Tests**:
   - Speaker detection from transcript lines
   - User mapping from speaker names
   - Individual score calculation
   - Edge cases: unknown speakers, system messages

2. **Integration Tests**:
   - Import WhatsApp chat with 2+ participants
   - Verify cards attributed to correct speakers
   - Verify individual scores calculated correctly

3. **Widget Tests**:
   - Individual scorecard displays correctly
   - Side-by-side comparison layout
   - Card count chips show accurate data

### Migration Strategy

1. **Phase 1 (Backend)**: Add speaker attribution to scoring service (backward compatible)
2. **Phase 2 (Storage)**: Store individual scores in JSON field
3. **Phase 3 (Frontend)**: Add individual scorecard UI
4. **Phase 4 (Enhancement)**: Add historical tracking of individual improvement

### Benefits

1. **Personal Accountability**: Clear visibility into individual contribution
2. **Fair Feedback**: No more "we both need to work on this" when only one person is the issue
3. **Growth Tracking**: See your personal improvement over time
4. **Relationship Balance**: Identify if one person is doing more emotional work
5. **Coaching Precision**: AI can provide person-specific suggestions

## Testing Requirements

- Unit tests for scoring engine
- Integration tests for API endpoints
- Widget tests for Flutter UI
- All tests must pass before merge

## API Endpoints

```
POST /auth/register       - Create account (email, password, name?)
POST /auth/login          - Login (email, password)

GET  /users/me            - Get current user
PATCH /users/me           - Update profile
DELETE /users/me          - Delete account

POST /couples             - Create couple (legacy)
POST /couples/join        - Join via invite code (legacy)
GET  /couples/me          - Get current couple (legacy)

GET  /relationships                    - List all user's relationships
POST /relationships                    - Create new relationship
GET  /relationships/:id                - Get relationship details
PATCH /relationships/:id               - Update relationship (name, status)
POST /relationships/:id/join           - Join via invite code
POST /relationships/:id/leave          - Leave relationship
GET  /relationships/:id/members        - Get all participants
GET  /relationships/:id/sessions       - Get shared sessions
GET  /relationships/:id/insights       - Get relationship insights
GET  /relationships/:id/health         - Get relationship health score
GET  /users/:userId/profile            - Get user profile (if in shared relationship)
GET  /users/:userId/personality-in/:relId  - Get personality in relationship context

POST /sessions            - Start session
GET  /sessions            - List sessions
GET  /sessions/:id        - Get session
POST /sessions/:id/transcribe - Transcribe audio
POST /sessions/:id/analyze    - Analyze transcript
GET  /sessions/:id/report     - Get match report
DELETE /sessions/:id      - Delete session
POST /sessions/import-whatsapp - Import WhatsApp chat export

GET  /gamification/dashboard - Get stats
GET  /gamification/quests    - Get active quests

POST /sessions/:id/ask       - Ask a question about a session (Claude Sonnet 4)
GET  /sessions/:id/questions - Get Q&A history for a session

GET  /insights/summary       - Get insights summary (patterns, trends)
GET  /insights/patterns      - Get detected patterns
POST /insights/patterns/analyze - Trigger pattern analysis
POST /insights/patterns/:id/acknowledge - Acknowledge a pattern
POST /insights/patterns/:id/dismiss - Dismiss a pattern

GET  /personality/me         - Get current user's personality profile
GET  /personality/user/:id   - Get another user's profile (same couple)
GET  /personality/evolution  - Get personality evolution over time
GET  /personality/couple     - Get couple relationship dynamics
GET  /personality/couple/comparison - Get side-by-side comparison
POST /personality/analyze/:sessionId - Analyze session for personality insights
```

## Session Q&A

### Overview
Users can ask natural language questions about any analyzed session. The system uses Claude Sonnet 4 with full session context to provide insightful answers.

### Example Questions
- "Why did the fight start?"
- "When did things escalate?"
- "Show me examples of contempt"
- "What could we have done differently?"
- "What repair attempts did we make?"

### Implementation
- **Backend**: `SessionQAService` builds context from transcript, analysis, cards, and horsemen data
- **Model**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Rate Limiting**: 5 questions per session per hour
- **Storage**: Q&A history persisted in `SessionQuestion` model

## Cross-Session Pattern Recognition

### Overview
The system automatically detects patterns across multiple sessions to provide actionable insights.

### Pattern Types
| Type | Description | Example |
|------|-------------|---------|
| `TOPIC_TRIGGER` | Topics that appear in low-score sessions | "4 of 6 arguments involved money" |
| `TIME_PATTERN` | Score correlations with time of day/week | "Arguments after 9 PM have 60% more red cards" |
| `BEHAVIOR_TREND` | Changes in specific behaviors over time | "Your repair attempts increased 40% this month" |
| `HORSEMAN_TREND` | Four Horsemen frequency changes | "Criticism has decreased by 30% over 8 sessions" |
| `POSITIVE_PATTERN` | Celebrations of good communication | "You've maintained a 5-session green streak!" |

### Metrics Cache
The `PatternMetricsCache` model stores aggregated metrics for fast pattern retrieval:
- Topic frequency distribution
- Hourly/weekday score distribution
- Monthly score averages
- Horsemen and repair attempt trends
- Card ratio trends

### Flutter Integration
- **Insights Screen**: 3-tab view at `/home/insights` (Patterns, Trends, Summary)
- **Home Dashboard**: Summary card appears when 2+ sessions exist
- **Pattern Actions**: Swipe to acknowledge or dismiss patterns

## Personality Profiles

### Overview
The app builds psychological profiles for each user based on their communication patterns in imported chats. Profiles are grounded in validated psychological research:

- **Big Five (OCEAN)**: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- **Attachment Style**: Based on Bowlby/Ainsworth theory (Secure, Anxious, Avoidant, Fearful)
- **Communication Style**: Based on Satir model (Placater, Blamer, Computer, Distracter, Leveler)
- **Emotional Intelligence**: Awareness, empathy, regulation scores
- **Conflict Patterns**: Thomas-Kilmann conflict styles

### Data Models
- `PersonalityProfile`: Per-user profile with all trait scores and narratives
- `LinguisticSnapshot`: Raw linguistic features extracted per session for evolution tracking
- `RelationshipDynamic`: Couple-level patterns (pursuer-withdrawer, power balance, etc.)

### Linguistic Analysis
The `LinguisticAnalysisService` extracts LIWC-style features from text:
- Pronoun usage (I/we/you ratios)
- Emotion words (positive, negative, anxiety, anger, sadness)
- Cognitive patterns (certainty, tentative, discrepancy words)
- Social dynamics (affiliation, achievement, power words)
- Communication markers (questions, exclamations, hedging)
- Four Horsemen detection (criticism, contempt, defensiveness, stonewalling)
- Repair attempt detection

### Profile Evolution
Profiles evolve over time as more sessions are analyzed. Each session creates a `LinguisticSnapshot` that contributes to the running profile averages with confidence scores based on data quantity.

### Flutter Integration
- **Personality Profile Screen**: 4-tab view at `/settings/personality` showing Overview, Big Five Traits, Attachment Style, and Coaching Tips
- **Couple Comparison Screen**: Side-by-side comparison at `/settings/personality/comparison` showing both partners' traits and compatibility insights
- **Relationship Coaching Screen**: Personalized tips at `/settings/personality/coaching` based on Gottman research and relationship dynamics
- **Settings Integration**: All personality features accessible from Settings → Personality section
