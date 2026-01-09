# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Mobile App (Flutter)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Onboarding  │  │    Auth     │  │   Session   │  │  Reports   │ │
│  │   Screen    │  │   Screen    │  │   Screen    │  │   Screen   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                           │                                         │
│                    ┌──────┴──────┐                                 │
│                    │  Riverpod   │                                 │
│                    │   State     │                                 │
│                    └──────┬──────┘                                 │
│                           │                                         │
│                    ┌──────┴──────┐                                 │
│                    │  API Client │                                 │
│                    │    (Dio)    │                                 │
│                    └──────┬──────┘                                 │
└───────────────────────────│─────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Railway Infrastructure                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     NestJS API Server                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐   │  │
│  │  │   Auth   │  │ Sessions │  │ Analysis │  │Gamification │   │  │
│  │  │  Module  │  │  Module  │  │  Module  │  │   Module    │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘   │  │
│  │                       │                                       │  │
│  │               ┌───────┴───────┐                              │  │
│  │               │ Prisma ORM    │                              │  │
│  │               └───────┬───────┘                              │  │
│  └───────────────────────│──────────────────────────────────────┘  │
│                          │                                          │
│  ┌───────────────────────┴──────────────────────────────────────┐  │
│  │                     PostgreSQL                                │  │
│  │  ┌───────┐ ┌───────┐ ┌─────────┐ ┌──────┐ ┌──────────────┐   │  │
│  │  │ Users │ │Couples│ │Sessions │ │Quests│ │EmotionalBank │   │  │
│  │  └───────┘ └───────┘ └─────────┘ └──────┘ └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       Redis                                   │  │
│  │              (BullMQ Job Queue + Caching)                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      External Services                               │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ OpenAI Whisper   │  │   OpenAI GPT     │                        │
│  │  (Transcription) │  │   (Coaching)     │                        │
│  └──────────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Session Recording Flow

```
1. User taps "Start Session"
2. App shows consent screen
3. User confirms, recording begins
4. User stops recording
5. Audio uploaded to API (temporary storage)
6. API calls Whisper for transcription
7. Transcript stored, audio deleted (default)
8. Scoring engine analyzes transcript
9. LLM generates coaching suggestions
10. Results stored in database
11. Report displayed to user
```

### Scoring Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Transcript  │────▶│ Rules Engine│────▶│ LLM Classify│
│   (Text)    │     │ (Patterns)  │     │  (Labels)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐      ┌─────────────┐
                    │   Cards     │      │  Coaching   │
                    │ (G/Y/R)     │      │ Suggestions │
                    └─────────────┘      └─────────────┘
                           │                    │
                           └──────────┬─────────┘
                                      ▼
                              ┌─────────────┐
                              │   Report    │
                              │  (JSON)     │
                              └─────────────┘
```

## Module Structure

### Backend (NestJS)

```
apps/api/src/
├── main.ts                 # Application entry
├── app.module.ts           # Root module
├── health.controller.ts    # Health checks
├── auth/                   # Authentication
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   └── dto/
├── users/                  # User management
├── couples/                # Couple pairing
├── sessions/               # Session CRUD
├── analysis/               # Transcription & scoring
│   ├── analysis.service.ts
│   ├── transcription.service.ts
│   └── scoring.service.ts
├── gamification/           # Quests & streaks
└── common/                 # Shared utilities
    └── prisma/
```

### Mobile (Flutter)

```
apps/mobile/lib/
├── main.dart               # Application entry
├── core/                   # Core infrastructure
│   ├── api/               # API client
│   ├── auth/              # Auth state
│   ├── config/            # App config
│   ├── router/            # Navigation
│   ├── theme/             # UI theme
│   └── widgets/           # Shared widgets
└── features/              # Feature modules
    ├── onboarding/
    ├── auth/
    ├── home/
    ├── session/
    ├── report/
    ├── history/
    ├── gamification/
    └── settings/
```

## Database Schema

### Entity Relationships

```
User 1──┬── n MagicLink
        │
        ├── 1 Couple (as partner1)
        │
        ├── 1 Couple (as partner2)
        │
        ├── n Session (as initiator)
        │
        ├── n EmotionalBankEntry
        │
        ├── n QuestProgress
        │
        └── 1 Streak

Couple 1──┬── n Session
          │
          ├── 1 EmotionalBankLedger
          │
          ├── n Quest
          │
          └── n WeeklyReport

Session 1──┬── 1 AnalysisResult
           │
           └── n EmotionalBankEntry

EmotionalBankLedger 1── n EmotionalBankEntry

Quest 1── n QuestProgress
```

## Security Considerations

1. **Authentication**: Magic link (passwordless)
2. **Authorization**: JWT with user/couple scoping
3. **Data Privacy**: Audio deleted by default
4. **Rate Limiting**: Throttle on all endpoints
5. **Input Validation**: Class-validator DTOs
6. **SQL Injection**: Prisma ORM (parameterized)
7. **Safety Detection**: Abuse pattern triggers resources

## Scalability Notes

- Stateless API (horizontally scalable)
- Redis for session caching and job queue
- PostgreSQL for persistent storage
- BullMQ for background job processing
- Audio processing offloaded to OpenAI
