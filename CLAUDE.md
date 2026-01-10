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
- [ ] Phase 6: Multi-Relationship UI & Features
- [ ] Phase 7: WhatsApp Report Sharing
- [ ] Phase 8: Type-Specific Coaching
- [ ] Phase 9: Relationship Lifecycle Management
- [ ] Phase 10: Polish & Hardening
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

POST /couples             - Create couple
POST /couples/join        - Join via invite code
GET  /couples/me          - Get current couple

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
