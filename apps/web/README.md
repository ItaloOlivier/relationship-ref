# Relationship Referee - Web Viewer

Public-facing Next.js 15 web viewer for shared Relationship Referee reports and personality profiles.

## Features

- **Shared Session Reports**: View match reports via public share links
- **Shared Personality Profiles**: View personality profiles via public share links
- **Server-Side Rendering**: Fast page loads with SEO-friendly meta tags
- **Open Graph Meta Tags**: Rich link previews for WhatsApp/social media sharing
- **Dark Mode**: Automatic dark mode support
- **Mobile Responsive**: Optimized for all screen sizes

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**

## Development

```bash
# Install dependencies
npm install

# Run dev server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Routes

- `/share/report/[token]` - View shared session report
- `/share/profile/[token]` - View shared personality profile

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000  # Backend API URL
```

## Components

### ReportViewer
Displays a full session report including:
- Overall match score (0-100)
- Card summary (green/yellow/red counts)
- Emotional bank account change
- Individual scorecards (if multi-speaker)
- Coach feedback (what went well, try next time, repair suggestions)
- Discussion topic tags
- Conversation highlights with cards

### ProfileViewer
Displays a personality profile including:
- Big Five traits (OCEAN model)
- Attachment style (anxiety/avoidance scores)
- Communication style
- Emotional intelligence (awareness, empathy, regulation)
- Strengths, challenges, and growth narratives

### CardBadge
Reusable component for displaying card counts with color coding.

### BankChangeIndicator
Shows emotional bank account change with up/down indicators.

### TraitGauge
Horizontal progress bar for personality trait scores.

## API Integration

The web viewer fetches data from the backend API:

- `GET /sessions/share/report/:token` - Fetch shared report
- `GET /personality/share/profile/:token` - Fetch shared profile

See [lib/api.ts](lib/api.ts) for full TypeScript interfaces.

## Deployment

The web viewer can be deployed to any platform that supports Next.js:

- **Vercel**: `vercel deploy`
- **Railway**: Connect GitHub repo
- **Docker**: `docker build -t relationship-referee-web .`

## SEO

Each shared link generates dynamic Open Graph meta tags for rich previews:

**Report Example:**
```
Title: Relationship Referee - Session Report (Score: 85)
Description: Overall Score: 85/100 | Green: 12 | Yellow: 3 | Red: 1
```

**Profile Example:**
```
Title: Relationship Referee - Personality Profile
Description: Communication Style: Leveler | Attachment: Secure
```

## Privacy

- Share tokens are unique, random, and non-guessable
- Users can disable sharing at any time (returns 404)
- No personal identifying information is displayed without explicit consent
- All data is fetched server-side (no client-side API keys)
