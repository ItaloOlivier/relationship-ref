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
- [ ] Phase 2: Flutter MVP
- [ ] Phase 3: Gamification Layer
- [ ] Phase 4: Polish & Hardening

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

GET  /gamification/dashboard - Get stats
GET  /gamification/quests    - Get active quests
```
