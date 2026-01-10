# Relationship Referee - Project Instructions

## Project Overview

Relationship Referee is a privacy-first mobile app that helps couples improve communication through AI-powered coaching sessions.

## Tech Stack

- **Mobile**: Flutter 3.38+ with Riverpod for state management
- **Backend**: NestJS with Prisma ORM
- **Database**: PostgreSQL
- **Queue**: BullMQ with Redis
- **AI**: OpenAI Whisper (transcription) + GPT-4o-mini (coaching)
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
```

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
- [ ] Phase 3: Gamification Layer (Most features already implemented)
- [ ] Phase 4: Polish & Hardening
- [ ] Phase 5: Personality Profiles (in progress)

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
POST /auth/magic-link     - Request magic link
GET  /auth/verify         - Verify magic link

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
```

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
