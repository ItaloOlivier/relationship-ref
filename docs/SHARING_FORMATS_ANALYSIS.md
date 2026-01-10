# Sharing Formats Analysis - Relationship Referee

## Executive Summary

This document analyzes sharing format options for session reports and participant profiles in the Relationship Referee app, considering privacy, usability, and technical feasibility.

**Recommendation:** **Web-based shareable links** as the primary sharing method, with **WhatsApp deep link integration** for mobile-first distribution.

---

## Use Cases

### 1. Session Reports (Match Reports)
**Who shares:** Relationship participants
**Share with:**
- Partner/group members (within relationship)
- Therapist/relationship coach (external professional)
- Trusted friend/mentor (external advisor)
- Self-reflection (export for personal records)

**Content to share:**
- Overall session score (0-100)
- Card counts (green/yellow/red)
- Individual scorecards (per-speaker metrics)
- Emotional bank change
- Coaching feedback (what went well, try next time, repair suggestions)
- Topic tags
- Card details (without full transcript for privacy)
- Q&A chat history (optional)

**Privacy requirements:**
- ✅ Anonymize speaker names (option)
- ✅ Redact full transcript (show quotes only)
- ✅ Time-limited access (7-30 days)
- ✅ Revocable links
- ⚠️ Audio NEVER included
- ⚠️ No identifiable WhatsApp metadata

### 2. Participant Profiles
**Who shares:** Individual users
**Share with:**
- Current partner (within relationship)
- New potential partner (dating context)
- Therapist/coach (professional assessment)

**Content to share:**
- Big Five personality traits (OCEAN scores)
- Attachment style
- Communication style
- Emotional intelligence metrics
- Conflict patterns
- Relationship-scoped metrics (sessions count, avg personal score, card ratios)

**Privacy requirements:**
- ✅ User must explicitly enable sharing
- ✅ Relationship-scoped data only (not cross-relationship)
- ✅ No sensitive relationship history details
- ✅ Revocable at any time

### 3. Relationship Directory Listings
**Who shares:** Relationship administrators/owners
**Share with:**
- New members (invite links)
- External observers (family, mediators)

**Content to share:**
- Relationship health score
- Trend indicator (improving/stable/declining)
- Members list (first names only)
- Session count
- Invite code (for joining)

**Privacy requirements:**
- ✅ No individual scorecards
- ✅ Aggregated metrics only
- ✅ Invite code expiry

---

## Format Options Analysis

### Option 1: Web-based Shareable Links ⭐ **RECOMMENDED**

**How it works:**
1. User taps "Share" button in app
2. Backend generates unique `shareToken` (32-char random string)
3. Public URL created: `https://app.relationshipreferee.com/share/report/{shareToken}`
4. Link opens in mobile browser (no login required)
5. Clean, mobile-optimized HTML report with Tailwind CSS

**Pros:**
- ✅ Universal - works on any device/platform
- ✅ No app install required for viewers
- ✅ Supports rich formatting (charts, gauges, cards)
- ✅ Easy to revoke (disable token)
- ✅ Time-limited expiry (automatic cleanup)
- ✅ Analytics-friendly (track opens, shares)
- ✅ WhatsApp preview cards (Open Graph meta tags)
- ✅ Professionally shareable (therapists, coaches)

**Cons:**
- ⚠️ Requires web app deployment (Next.js/React)
- ⚠️ Public URL means discoverable if token leaked
- ⚠️ Requires backend API for public endpoint

**Privacy controls:**
- Token-based access (no indexing, no guessing)
- Configurable expiry (7/14/30 days)
- Revoke button in app
- Anonymize option (replaces "Michael" with "Person A")
- Redacted transcript (quotes only, no full text)
- No audio links

**Technical implementation:**
```typescript
// Backend: apps/api/src/sessions/sessions.controller.ts
@Post(':id/share')
async createShareLink(@Param('id') sessionId: string, @Body() dto: CreateShareLinkDto) {
  const shareToken = generateSecureToken(32);
  const expiry = addDays(new Date(), dto.expiryDays || 7);

  await this.prisma.session.update({
    where: { id: sessionId },
    data: {
      shareToken,
      shareTokenExpiry: expiry,
      shareEnabled: true,
    },
  });

  return {
    shareUrl: `https://app.relationshipreferee.com/share/report/${shareToken}`,
    expiresAt: expiry,
  };
}

@Get('share/report/:shareToken')
@Public() // No authentication required
async getSharedReport(@Param('shareToken') shareToken: string) {
  const session = await this.prisma.session.findFirst({
    where: {
      shareToken,
      shareEnabled: true,
      shareTokenExpiry: { gte: new Date() }, // Not expired
    },
    include: {
      analysisResult: true,
      relationship: { select: { type: true } },
    },
  });

  if (!session) throw new NotFoundException('Report not found or expired');

  // Return sanitized data (no transcript, no audio)
  return {
    score: session.analysisResult.overallScore,
    cards: session.analysisResult.cards,
    individualScores: session.analysisResult.individualScores,
    coaching: {
      whatWentWell: session.analysisResult.whatWentWell,
      tryNextTime: session.analysisResult.tryNextTime,
    },
    // Transcript excluded for privacy
  };
}
```

**Frontend (Next.js web app):**
```tsx
// apps/web/pages/share/report/[token].tsx
export default function SharedReport({ report }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <ShareHeader />
        <ScoreCard score={report.score} />
        <CardsSummary cards={report.cards} />
        <IndividualScorecards scores={report.individualScores} />
        <CoachingFeedback coaching={report.coaching} />
        <ShareFooter />
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const res = await fetch(`${API_URL}/sessions/share/report/${params.token}`);
  if (!res.ok) return { notFound: true };
  return { props: { report: await res.json() } };
}
```

**WhatsApp Integration:**
```dart
// Flutter: share_service.dart
import 'package:url_launcher/url_launcher.dart';

Future<void> shareReportViaWhatsApp(String shareUrl) async {
  final message = Uri.encodeComponent(
    'Check out our relationship session report: $shareUrl'
  );
  final whatsappUrl = 'https://wa.me/?text=$message';

  if (await canLaunchUrl(Uri.parse(whatsappUrl))) {
    await launchUrl(Uri.parse(whatsappUrl));
  }
}
```

---

### Option 2: PDF Export

**How it works:**
1. User taps "Export PDF" button
2. Backend generates PDF using Puppeteer/jsPDF
3. PDF downloaded to device
4. User shares via native share sheet (WhatsApp, Email, etc.)

**Pros:**
- ✅ Universal format (all devices support)
- ✅ Professional appearance
- ✅ Printable (for therapists)
- ✅ Offline access
- ✅ No expiry concerns

**Cons:**
- ⚠️ Static - no interactivity
- ⚠️ Larger file size (1-5 MB)
- ⚠️ PDF generation is slow (2-5 seconds)
- ⚠️ Complex to style (HTML to PDF conversion)
- ⚠️ Difficult to revoke once sent
- ⚠️ Not mobile-optimized (zooming required)

**Use case:** Secondary option for professional contexts (therapist intake forms, legal documentation)

**Technical implementation:**
```typescript
// Backend: PDF generation
import puppeteer from 'puppeteer';

async generateReportPDF(sessionId: string): Promise<Buffer> {
  const session = await this.getSessionReport(sessionId);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = renderReportTemplate(session); // Render HTML template
  await page.setContent(html);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdf;
}
```

---

### Option 3: In-App Sharing (Screenshots/Images)

**How it works:**
1. User takes screenshot of report screen
2. Native share sheet allows sharing image

**Pros:**
- ✅ Zero development required (already works)
- ✅ Familiar UX (standard mobile behavior)
- ✅ Works offline

**Cons:**
- ⚠️ Low quality (compressed images)
- ⚠️ Multi-page reports require multiple screenshots
- ⚠️ No analytics (can't track shares)
- ⚠️ Unprofessional appearance
- ⚠️ Hard to read on small screens

**Use case:** Quick sharing with partners (not professional contexts)

---

### Option 4: JSON/CSV Export (Data Portability)

**How it works:**
1. User taps "Export Data"
2. Backend generates JSON or CSV file
3. User downloads and imports into other tools (Excel, research databases)

**Pros:**
- ✅ Data portability
- ✅ Machine-readable
- ✅ Research-friendly (academic studies)

**Cons:**
- ⚠️ Not human-readable
- ⚠️ Requires technical knowledge
- ⚠️ Not shareable with non-technical users

**Use case:** Data export for research, therapy intake forms, personal backup

---

### Option 5: Email Integration

**How it works:**
1. User enters recipient email
2. Backend sends email with embedded report
3. Opens in recipient's email client

**Pros:**
- ✅ Familiar UX
- ✅ Professional communication channel
- ✅ Can include custom message

**Cons:**
- ⚠️ Email deliverability issues (spam filters)
- ⚠️ No analytics
- ⚠️ Requires user email collection
- ⚠️ No revocation possible
- ⚠️ Security concerns (email is not encrypted)

**Use case:** Secondary option for therapist communication

---

## Privacy Matrix

| Format | Anonymizable | Revocable | Expirable | Redacted Transcript | Analytics |
|--------|--------------|-----------|-----------|-------------------|-----------|
| **Web Links** ⭐ | ✅ Yes | ✅ Yes | ✅ Yes (7-30d) | ✅ Yes | ✅ Yes |
| PDF | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Screenshots | ⚠️ Manual | ❌ No | ❌ No | ⚠️ If visible | ❌ No |
| JSON/CSV | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Email | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ⚠️ Limited |

---

## Recommended Architecture

### Phase 1: Web-based Shareable Links (Primary)

**Why this wins:**
1. **Privacy-first:** Revocable, expirable, token-based access
2. **Mobile-optimized:** WhatsApp deep links, Open Graph previews
3. **Professional:** Clean UI, works across platforms
4. **Analytics:** Track share rate, link opens, conversion
5. **Universal:** No app install required

**Components to build:**
1. **Backend API:**
   - `POST /sessions/:id/share` - Generate share link
   - `GET /share/report/:token` - Public report endpoint
   - `DELETE /sessions/:id/share` - Revoke link
   - `POST /profiles/:userId/share` - Share participant profile
   - `GET /share/profile/:token` - Public profile endpoint

2. **Web App (Next.js):**
   - `/share/report/[token]` - Session report viewer
   - `/share/profile/[token]` - Participant profile viewer
   - Tailwind CSS for styling
   - Open Graph meta tags for WhatsApp previews

3. **Flutter UI:**
   - Share button in `ReportScreen` (line 53-61)
   - Share dialog with options:
     - Anonymize speaker names ☐
     - Include Q&A chat ☐
     - Expiry: [7 days ▼]
   - Copy link button
   - WhatsApp quick share button

4. **Database Schema (already exists):**
   ```prisma
   model Session {
     shareToken       String?   @unique
     shareTokenExpiry DateTime?
     shareEnabled     Boolean   @default(false)
   }

   model PersonalityProfile {
     shareToken       String?   @unique
     shareTokenExpiry DateTime?
     shareEnabled     Boolean   @default(false)
   }
   ```

### Phase 2: PDF Export (Secondary)

**When to use:**
- Professional contexts (therapist intake)
- Legal documentation
- Offline archival

**Implementation:**
- Add "Export PDF" button (secondary action)
- Use Puppeteer or jsPDF for generation
- Save to device Downloads folder

---

## Security Considerations

### 1. Token Generation
- Use cryptographically secure random tokens (32+ chars)
- Prevent brute-force guessing (rate limiting)
- No sequential IDs

```typescript
import crypto from 'crypto';

function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
```

### 2. Access Control
- Check `shareEnabled = true` before serving
- Verify `shareTokenExpiry > NOW()`
- Return 404 (not 403) to prevent enumeration

### 3. Data Sanitization
- **NEVER include:**
  - Audio files or URLs
  - Full transcript (quotes only)
  - WhatsApp phone numbers
  - User email addresses
- **Anonymization:**
  - Replace "Michael" with "Person A"
  - Replace "Sarah" with "Person B"
  - Keep structure intact

### 4. Rate Limiting
- Max 5 share link generations per user per hour
- Max 100 share link views per token per day (prevent abuse)

---

## Analytics & Metrics

Track the following:
1. **Share rate:** % of completed sessions that generate share link
2. **Share method:** WhatsApp vs Email vs Copy Link
3. **Link opens:** Unique views per share token
4. **Link conversion:** % of viewers who sign up for app
5. **Expiry rate:** % of links that expire unused

**Implementation:**
```typescript
// Track share link creation
await this.prisma.shareEvent.create({
  data: {
    sessionId,
    eventType: 'LINK_CREATED',
    shareMethod: 'WHATSAPP',
    metadata: { expiryDays: 7 },
  },
});

// Track share link view
await this.prisma.shareEvent.create({
  data: {
    sessionId,
    eventType: 'LINK_VIEWED',
    metadata: {
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
    },
  },
});
```

---

## UI/UX Mockup

### Mobile App - Share Dialog

```
┌─────────────────────────────────────┐
│  Share Session Report               │
├─────────────────────────────────────┤
│                                     │
│  Privacy Options:                   │
│  ☑ Anonymize speaker names          │
│  ☐ Include Q&A chat history         │
│                                     │
│  Link Expiry:                       │
│  ◉ 7 days                           │
│  ○ 14 days                          │
│  ○ 30 days                          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ https://app.relationshipre… │   │
│  │ [Copy Link]                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Share via WhatsApp]               │
│  [Share via Email]                  │
│                                     │
│  [Cancel]                           │
└─────────────────────────────────────┘
```

### Web App - Shared Report View

```
┌─────────────────────────────────────┐
│  🏆 Relationship Session Report     │
│  Generated by Relationship Referee  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Session Score: 78/100       │ │
│  │   [■■■■■■■■□□] 🟢 Great!      │ │
│  └───────────────────────────────┘ │
│                                     │
│  Cards Received:                    │
│  🟢 12  🟡 4  🔴 1                 │
│                                     │
│  Individual Scorecards:             │
│  Person A: 82/100                   │
│  Person B: 74/100                   │
│                                     │
│  [View Full Report in App]          │
│                                     │
│  ───────────────────────────────    │
│  Powered by Relationship Referee    │
│  Get the app: [iOS] [Android]       │
└─────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: Backend API (Week 1)
- ✅ Add share link generation endpoint
- ✅ Add public report endpoint with sanitization
- ✅ Add revoke link endpoint
- ✅ Add share event tracking
- ✅ Write integration tests

### Step 2: Next.js Web App (Week 1-2)
- ✅ Set up Next.js project (`apps/web-share`)
- ✅ Create `/share/report/[token]` page
- ✅ Design mobile-optimized report view
- ✅ Add Open Graph meta tags
- ✅ Deploy to Vercel/Railway

### Step 3: Flutter UI (Week 2)
- ✅ Add Share button to ReportScreen
- ✅ Create ShareDialog component
- ✅ Implement WhatsApp deep link
- ✅ Add "Manage Shared Links" screen in Settings

### Step 4: Analytics & Monitoring (Week 3)
- ✅ Set up share event tracking
- ✅ Create analytics dashboard
- ✅ Add Sentry error tracking

### Step 5: PDF Export (Week 4 - Optional)
- ✅ Add PDF generation endpoint
- ✅ Add "Export PDF" button (secondary action)

---

## Success Metrics

**Target KPIs (3 months post-launch):**
- Share rate: ≥30% of completed sessions
- Link open rate: ≥60% of generated links
- Conversion rate: ≥10% of link viewers sign up
- Average link lifetime: 5-7 days (before expiry)
- User satisfaction: ≥4.5/5 stars (sharing feature)

---

## Conclusion

**Recommendation:** Build web-based shareable links as the primary sharing method, integrated with WhatsApp deep links for mobile-first distribution. This provides the best balance of privacy, usability, and professional presentation while maintaining full control over shared data.

**Next Steps:**
1. Approve this approach
2. Estimate development effort (3-4 weeks for full implementation)
3. Design Next.js web app mockups
4. Begin backend API development
