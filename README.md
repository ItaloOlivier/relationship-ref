# Relationship Referee

A privacy-first mobile app that helps couples improve communication through AI-powered coaching sessions.

## Overview

Relationship Referee uses evidence-based relationship science (Gottman Four Horsemen + Emotional Bank Account) to analyze conversations and provide actionable feedback. The app gamifies relationship improvement through:

- **Coach Sessions**: Record conversations with consent, get transcribed analysis
- **Match Reports**: Green/Yellow/Red cards based on communication patterns
- **Emotional Bank Account**: Track deposits and withdrawals in your relationship
- **Daily Quests & Streaks**: Gamified challenges to build healthy habits

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Flutter 3.38+ (Riverpod, Drift) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL |
| Queue | BullMQ + Redis |
| Transcription | OpenAI Whisper API |
| Hosting | Railway |

## Project Structure

```
relationship-ref/
├── apps/
│   ├── api/          # NestJS backend
│   └── mobile/       # Flutter app
├── docs/             # Architecture & API docs
└── .github/
    └── workflows/    # CI/CD pipelines
```

## Quick Start

### Prerequisites

- Flutter 3.38+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Railway CLI

### Local Development

#### Backend

```bash
cd apps/api
cp .env.example .env
# Edit .env with your credentials
npm install
npm run db:migrate
npm run dev
```

#### Mobile

```bash
cd apps/mobile
cp .env.example .env
flutter pub get
flutter run
```

### Railway Deployment

See [docs/deployment.md](docs/deployment.md) for full Railway setup instructions.

```bash
# Login to Railway
railway login

# Link project
railway link

# Deploy
railway up
```

## Environment Variables

See `.env.example` files in each app directory.

## Privacy & Safety

- **Consent-first**: Recording only starts with explicit user consent
- **No audio storage by default**: Only transcripts and scores are stored
- **Data export**: Users can export all their data
- **Delete account**: Full data deletion available
- **Safety resources**: Abuse detection shows neutral safety prompts with resources

## Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Privacy Policy](docs/privacy.md)

## Development Phases

- [x] Phase 0: Repository setup & CI/CD
- [x] Phase 1: Backend MVP
- [ ] Phase 2: Flutter MVP
- [ ] Phase 3: Gamification Layer
- [ ] Phase 4: Polish & Hardening

## License

Proprietary - All rights reserved

## Disclaimer

This app is for coaching and wellness purposes only. It is not a substitute for professional therapy or counseling. If you or your partner are in crisis, please contact a mental health professional or crisis hotline.
