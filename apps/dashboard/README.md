# Relationship Referee - Web Dashboard

A comprehensive web dashboard for the Relationship Referee app, built with Next.js 15, React 19, and TypeScript.

## Features

### ✅ Completed (Phase 1-6)
- **Authentication**: Login, register with JWT token management
- **Dashboard Layout**: Responsive sidebar navigation
- **Home Dashboard**: Stats overview with streaks, sessions, emotional bank
- **API Integration**: Type-safe client with all backend endpoints
- **Protected Routes**: Auto-redirect for unauthorized users
- **Dark Mode**: Full support with Tailwind CSS

### 🚧 In Progress (Phase 7-17)
- Sessions management (list, create, view, delete)
- New session (audio upload + WhatsApp import)
- Session detail with full report viewer
- Gamification dashboard
- Personality profiles
- Relationship directory
- Insights and patterns
- Session Q&A chat

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **State**: Zustand (planned)
- **API**: Custom fetch client with JWT auth
- **Charts**: Recharts (planned for insights)
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 20+
- Backend API running (see `/apps/api`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local and set:
NEXT_PUBLIC_API_URL=http://localhost:3000  # Or production API URL
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3001
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── dashboard/     # Home dashboard
│   │   ├── sessions/      # Sessions management (TODO)
│   │   ├── gamification/  # Quests and rewards (TODO)
│   │   ├── personality/   # Personality profiles (TODO)
│   │   ├── relationships/ # Relationship directory (TODO)
│   │   ├── insights/      # Patterns and trends (TODO)
│   │   └── settings/      # User settings (TODO)
│   ├── login/             # Login page
│   ├── register/          # Register page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── auth/              # Auth-related components
│       └── ProtectedRoute.tsx
├── lib/
│   └── api.ts             # API client with JWT auth
├── types/
│   └── index.ts           # TypeScript type definitions
└── styles/
    └── globals.css        # Global styles and Tailwind config
```

## API Client

The `api.ts` client provides type-safe methods for all backend endpoints:

```typescript
import { api } from '@/lib/api';

// Authentication
await api.login(email, password);
await api.register(email, password, name);
api.logout();

// Sessions
const sessions = await api.getSessions();
const session = await api.getSession(id);
await api.uploadAudio(sessionId, audioFile);
await api.importWhatsAppChat(chatFile);

// Gamification
const stats = await api.getGamificationStats();
const quests = await api.getQuests();

// Relationships
const relationships = await api.getRelationships();

// Personality
const profile = await api.getMyPersonality();

// Insights
const patterns = await api.getPatterns();
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |

## Development Commands

```bash
npm run dev         # Start dev server (port 3001)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` = `https://relationship-ref-production.up.railway.app`

4. **Access Dashboard**:
   - Production: `https://your-dashboard-domain.vercel.app`

### Update API CORS

Ensure the backend API allows your dashboard domain:

```typescript
// apps/api/src/bootstrap.ts
const allowedOrigins = [
  'https://your-dashboard-domain.vercel.app',
  // ... other origins
];
```

## Features Roadmap

### Phase 7-10: Sessions Management (Next)
- [ ] Sessions list with filters (status, date range, source)
- [ ] New session page (audio upload OR WhatsApp import)
- [ ] Session detail page
- [ ] Full report viewer (cards, bank, feedback, coaching)
- [ ] Individual scorecards display
- [ ] Session delete confirmation

### Phase 11-13: Advanced Features
- [ ] Gamification dashboard (quests, streaks, badges, leaderboard)
- [ ] Personality profile viewer (Big Five, attachment, coaching)
- [ ] Couple comparison side-by-side

### Phase 14-16: Relationships & Insights
- [ ] Relationship directory (list, create, join)
- [ ] Relationship detail (members, sessions, health)
- [ ] Insights dashboard (patterns, trends, charts)
- [ ] Pattern acknowledgment/dismissal
- [ ] Session Q&A chat interface

### Phase 17: Polish & Deployment
- [ ] User settings (profile, password, notifications)
- [ ] Dark mode toggle
- [ ] Mobile responsive improvements
- [ ] Error boundary components
- [ ] Loading states optimization
- [ ] Production deployment
- [ ] End-to-end testing

## Contributing

1. Create feature branch: `git checkout -b feature/session-list`
2. Implement feature following project structure
3. Add TypeScript types to `src/types/index.ts`
4. Update API client in `src/lib/api.ts` if needed
5. Test locally: `npm run dev`
6. Commit: `git commit -m "Add sessions list page"`
7. Push: `git push origin feature/session-list`

## Testing

```bash
# Run tests (when implemented)
npm test

# Watch mode
npm test -- --watch
```

## Known Issues

- [ ] Audio recording on web requires MediaRecorder API (use upload instead)
- [ ] Real-time session status updates not implemented (polling needed)
- [ ] Mobile responsive navigation needs hamburger menu

## License

Proprietary - Relationship Referee

## Support

For questions or issues:
- Check [CLAUDE.md](/CLAUDE.md) for full project documentation
- Review [API documentation](https://relationship-ref-production.up.railway.app/api/docs)
- See [DEPLOYMENT_STATUS.md](/DEPLOYMENT_STATUS.md) for production info
