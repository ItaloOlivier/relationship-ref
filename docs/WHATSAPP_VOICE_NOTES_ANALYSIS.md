# WhatsApp Voice Notes Analysis - Technical Design

**Date:** 2026-01-10
**Status:** Design / Proposal
**Complexity:** Medium-High
**Estimated Effort:** 2-3 weeks

---

## Executive Summary

Enable Relationship Referee to process voice notes from WhatsApp chat exports, combining text and audio analysis for richer relationship insights. Voice notes contain crucial emotional context (tone, pacing, emotion) that text alone cannot capture.

---

## Problem Statement

**Current Limitation:**
WhatsApp chat exports show `<audio omitted>` for voice messages when exported without media. When exported with media, audio files are separate and not linked to the analysis pipeline.

**User Impact:**
- Missing emotional context from voice tone, pacing, and prosody
- Incomplete conversation analysis when voice notes are primary communication method
- No ability to detect Four Horsemen patterns in audio (contempt via sarcasm, stonewalling via silence)

**Opportunity:**
Voice notes often contain the most emotionally charged communication in relationships. Adding voice analysis would significantly improve coaching quality.

---

## WhatsApp Export Behavior

### Text Export Format

According to [WhatsApp's official documentation](https://faq.whatsapp.com/1180414079177245):

**Without Media:**
```
01/15/2024, 10:32 - John: <audio omitted>
```

**With Media:**
```
01/15/2024, 10:32 - John: <audio omitted>
```
+ Separate audio files: `PTT-20240115-WA0001.opus`, `PTT-20240115-WA0002.m4a`

### Audio File Formats

Based on [multiple sources](https://www.ionos.com/digitalguide/online-marketing/social-media/how-to-save-audio-from-whatsapp/):

- **Android:** `.opus` (Opus codec) or `.m4a` (MPEG-4 Audio)
- **iOS:** `.m4a` (Apple MPEG-4 Audio)
- **File Naming:** `PTT-YYYYMMDD-WAxxxx.{opus|m4a}` (PTT = Push-To-Talk)

---

## Technical Architecture

### 1. WhatsApp Parser Enhancement

**Current State:**
`WhatsAppParserService` treats `<audio omitted>` as a system message and filters it out.

**Required Changes:**

```typescript
// apps/api/src/sessions/services/whatsapp-parser.service.ts

export interface ParsedMessage {
  timestamp: Date;
  sender: string;
  content: string;
  isSystemMessage: boolean;
  isAudioMessage: boolean;      // NEW
  audioMetadata?: {              // NEW
    placeholder: string;         // "<audio omitted>"
    estimatedFilename?: string;  // PTT-YYYYMMDD-WAxxxx
    durationSeconds?: number;    // from filename or metadata
  };
}

export interface ParsedChat {
  messages: ParsedMessage[];
  participants: string[];
  startDate: Date | null;
  endDate: Date | null;
  messageCount: number;
  audioMessageCount: number;     // NEW
  audioFiles?: UploadedAudioFile[]; // NEW
}

interface UploadedAudioFile {
  filename: string;
  buffer: Buffer;
  mimeType: string;              // audio/ogg, audio/m4a
  sizeBytes: number;
  estimatedTimestamp?: Date;     // parsed from filename
}
```

**Parser Logic:**

```typescript
private parseLine(line: string): ParsedMessage | null {
  for (const pattern of this.MESSAGE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      const [, dateStr, timeStr, sender, content] = match;
      const timestamp = this.parseDateTime(dateStr, timeStr);

      if (timestamp) {
        const isSystem = this.isSystemMessage(sender, content);
        const isAudio = this.isAudioMessage(content);

        return {
          timestamp,
          sender: sender.trim(),
          content: content.trim(),
          isSystemMessage: isSystem,
          isAudioMessage: isAudio,
          audioMetadata: isAudio ? {
            placeholder: content.trim(),
            estimatedFilename: this.estimateAudioFilename(timestamp)
          } : undefined
        };
      }
    }
  }
  return null;
}

private isAudioMessage(content: string): boolean {
  return /<audio omitted>/i.test(content);
}

private estimateAudioFilename(timestamp: Date): string {
  // Format: PTT-YYYYMMDD-WA0001
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  return `PTT-${year}${month}${day}-WA*`;
}
```

---

### 2. Audio File Upload & Matching

**API Endpoint:**

```typescript
// apps/api/src/sessions/dto/import-whatsapp-with-audio.dto.ts

export class ImportWhatsAppWithAudioDto extends ImportWhatsAppDto {
  @ApiPropertyOptional({
    description: 'Array of audio files (PTT voice notes) from WhatsApp export',
    type: 'array',
    items: { type: 'string', format: 'binary' }
  })
  @IsOptional()
  audioFiles?: Express.Multer.File[];  // Multer file upload
}
```

**Controller:**

```typescript
// apps/api/src/sessions/sessions.controller.ts

@Post('import-whatsapp-with-audio')
@UseInterceptors(FilesInterceptor('audioFiles', 50, {
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/ogg' ||
        file.mimetype === 'audio/opus' ||
        file.mimetype === 'audio/m4a' ||
        file.mimetype === 'audio/x-m4a') {
      cb(null, true);
    } else {
      cb(new BadRequestException('Only audio files allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
}))
async importWithAudio(
  @Request() req: any,
  @Body() dto: ImportWhatsAppWithAudioDto,
  @UploadedFiles() audioFiles: Express.Multer.File[]
) {
  return this.sessionsService.importWhatsAppChatWithAudio(
    req.user.id,
    dto,
    audioFiles
  );
}
```

**Filename Matching Strategy:**

```typescript
// Match audio files to messages based on:
// 1. Filename timestamp (PTT-20240115-WA0001.opus)
// 2. Message timestamp proximity (within ±5 minutes)
// 3. Sequential order if timestamps match

interface AudioMatch {
  messageIndex: number;
  audioFile: UploadedAudioFile;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchReason: string;
}

function matchAudioFilesToMessages(
  messages: ParsedMessage[],
  audioFiles: UploadedAudioFile[]
): AudioMatch[] {
  const matches: AudioMatch[] = [];
  const audioMessages = messages
    .map((m, idx) => ({ message: m, index: idx }))
    .filter(({ message }) => message.isAudioMessage);

  for (const audioFile of audioFiles) {
    const fileTimestamp = parseAudioFileTimestamp(audioFile.filename);

    if (!fileTimestamp) {
      // Fallback: match by order
      const unmatchedIndex = audioMessages.findIndex(
        am => !matches.some(m => m.messageIndex === am.index)
      );
      if (unmatchedIndex !== -1) {
        matches.push({
          messageIndex: audioMessages[unmatchedIndex].index,
          audioFile,
          confidence: 'LOW',
          matchReason: 'Sequential order (no timestamp in filename)'
        });
      }
      continue;
    }

    // Find closest message timestamp within ±5 minutes
    let bestMatch: { index: number; timeDiff: number } | null = null;

    for (const { message, index } of audioMessages) {
      const timeDiff = Math.abs(
        message.timestamp.getTime() - fileTimestamp.getTime()
      );
      const fiveMinutes = 5 * 60 * 1000;

      if (timeDiff <= fiveMinutes) {
        if (!bestMatch || timeDiff < bestMatch.timeDiff) {
          bestMatch = { index, timeDiff };
        }
      }
    }

    if (bestMatch) {
      const confidence =
        bestMatch.timeDiff < 60000 ? 'HIGH' :    // <1 min
        bestMatch.timeDiff < 180000 ? 'MEDIUM' : // <3 min
        'LOW';                                    // <5 min

      matches.push({
        messageIndex: bestMatch.index,
        audioFile,
        confidence,
        matchReason: `Timestamp match (${Math.round(bestMatch.timeDiff / 1000)}s difference)`
      });
    }
  }

  return matches;
}

function parseAudioFileTimestamp(filename: string): Date | null {
  // PTT-20240115-WA0001.opus → 2024-01-15
  const match = filename.match(/PTT-(\d{4})(\d{2})(\d{2})-WA\d+/);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}
```

---

### 3. Audio Transcription Pipeline

**Service Enhancement:**

```typescript
// apps/api/src/sessions/sessions.service.ts

async importWhatsAppChatWithAudio(
  userId: string,
  dto: ImportWhatsAppWithAudioDto,
  audioFiles: Express.Multer.File[]
): Promise<{
  session: any;
  parsedChat: ParsedChat;
  audioMatches: AudioMatch[];
  transcriptionStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}> {
  // 1. Parse text export
  const parsedChat = this.whatsAppParser.parseChat(dto.chatContent);

  // 2. Match audio files to messages
  const uploadedAudioFiles: UploadedAudioFile[] = audioFiles.map(f => ({
    filename: f.originalname,
    buffer: f.buffer,
    mimeType: f.mimetype,
    sizeBytes: f.size
  }));

  const audioMatches = matchAudioFilesToMessages(
    parsedChat.messages,
    uploadedAudioFiles
  );

  // 3. Create session
  const session = await this.createSessionWithAudioPlaceholders(
    userId,
    dto,
    parsedChat,
    audioMatches
  );

  // 4. Enqueue audio transcription jobs (async)
  if (audioMatches.length > 0) {
    await this.queueAudioTranscriptionJobs(session.id, audioMatches);
  }

  return {
    session,
    parsedChat,
    audioMatches,
    transcriptionStatus: audioMatches.length > 0 ? 'PENDING' : 'COMPLETED'
  };
}

private async createSessionWithAudioPlaceholders(
  userId: string,
  dto: ImportWhatsAppWithAudioDto,
  parsedChat: ParsedChat,
  audioMatches: AudioMatch[]
): Promise<any> {
  // Initial transcript with [AUDIO PENDING] placeholders
  const transcriptWithPlaceholders = parsedChat.messages
    .filter(m => !m.isSystemMessage)
    .map((m, idx) => {
      const audioMatch = audioMatches.find(am => am.messageIndex === idx);
      if (audioMatch) {
        return `${m.sender}: [AUDIO PENDING: ${audioMatch.audioFile.filename}]`;
      }
      return `${m.sender}: ${m.content}`;
    })
    .join('\n');

  const session = await this.prisma.session.create({
    data: {
      // ... existing fields
      transcript: transcriptWithPlaceholders,
      status: SessionStatus.TRANSCRIBING, // Will update when all audio done
      audioMessageCount: audioMatches.length,
    }
  });

  // Store audio files in database for transcription queue
  await this.prisma.audioTranscriptionJob.createMany({
    data: audioMatches.map(am => ({
      sessionId: session.id,
      messageIndex: am.messageIndex,
      audioFilename: am.audioFile.filename,
      audioBuffer: am.audioFile.buffer,
      mimeType: am.audioFile.mimeType,
      matchConfidence: am.confidence,
      status: 'PENDING'
    }))
  });

  return session;
}
```

---

### 4. Database Schema Changes

```prisma
// apps/api/prisma/schema.prisma

model Session {
  // ... existing fields
  audioMessageCount Int? @default(0)
  audioTranscriptionJobs AudioTranscriptionJob[]
}

model AudioTranscriptionJob {
  id              String   @id @default(cuid())
  sessionId       String
  messageIndex    Int
  audioFilename   String
  audioBuffer     Bytes              // Store temporarily until transcribed
  mimeType        String             // audio/ogg, audio/m4a
  matchConfidence String             // HIGH, MEDIUM, LOW
  status          String             // PENDING, IN_PROGRESS, COMPLETED, FAILED
  transcript      String?
  duration        Int?               // seconds
  errorMessage    String?
  createdAt       DateTime @default(now())
  completedAt     DateTime?

  session         Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([status])
}
```

---

### 5. Transcription Queue (BullMQ)

**Queue Definition:**

```typescript
// apps/api/src/analysis/queues/audio-transcription.queue.ts

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

interface AudioTranscriptionJobData {
  jobId: string;
  sessionId: string;
  messageIndex: number;
  audioBuffer: Buffer;
  mimeType: string;
}

@Processor('audio-transcription')
export class AudioTranscriptionProcessor {
  constructor(
    private prisma: PrismaService,
    private transcriptionService: TranscriptionService
  ) {}

  @Process('transcribe')
  async handleTranscription(job: Job<AudioTranscriptionJobData>) {
    const { jobId, sessionId, messageIndex, audioBuffer, mimeType } = job.data;

    try {
      // Update status to IN_PROGRESS
      await this.prisma.audioTranscriptionJob.update({
        where: { id: jobId },
        data: { status: 'IN_PROGRESS' }
      });

      // Convert buffer to file extension
      const ext = mimeType.includes('opus') ? 'opus' : 'm4a';
      const filename = `audio-${jobId}.${ext}`;

      // Transcribe using OpenAI Whisper
      const transcript = await this.transcriptionService.transcribeFromBuffer(
        audioBuffer,
        filename
      );

      // Update job with transcript
      await this.prisma.audioTranscriptionJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          transcript,
          completedAt: new Date()
        }
      });

      // Check if all jobs for this session are complete
      await this.updateSessionTranscript(sessionId);

    } catch (error) {
      await this.prisma.audioTranscriptionJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  private async updateSessionTranscript(sessionId: string) {
    const allJobs = await this.prisma.audioTranscriptionJob.findMany({
      where: { sessionId },
      orderBy: { messageIndex: 'asc' }
    });

    const allCompleted = allJobs.every(j => j.status === 'COMPLETED' || j.status === 'FAILED');

    if (!allCompleted) return;

    // Rebuild transcript with transcribed audio
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { audioTranscriptionJobs: true }
    });

    const updatedTranscript = this.rebuildTranscript(session);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        transcript: updatedTranscript,
        status: SessionStatus.UPLOADED // Ready for analysis
      }
    });
  }

  private rebuildTranscript(session: any): string {
    const lines = session.transcript.split('\n');
    const jobsByIndex = new Map(
      session.audioTranscriptionJobs.map(j => [j.messageIndex, j])
    );

    return lines.map((line, idx) => {
      const job = jobsByIndex.get(idx);
      if (job && job.status === 'COMPLETED') {
        const [sender] = line.split(':');
        return `${sender}: ${job.transcript}`;
      }
      return line;
    }).join('\n');
  }
}
```

---

### 6. Flutter Mobile UI Changes

**File Upload UI:**

```dart
// apps/mobile/lib/features/import/import_whatsapp_screen.dart

class ImportWhatsAppScreen extends ConsumerStatefulWidget {
  // ... existing code

  Future<void> _pickAudioFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['opus', 'm4a', 'ogg'],
    );

    if (result != null) {
      setState(() {
        _selectedAudioFiles = result.files;
      });
    }
  }

  Widget _buildAudioFilesList() {
    if (_selectedAudioFiles == null || _selectedAudioFiles!.isEmpty) {
      return Card(
        child: ListTile(
          leading: Icon(Icons.mic),
          title: Text('Optional: Add voice notes'),
          subtitle: Text('Tap to select audio files from WhatsApp export'),
          trailing: Icon(Icons.add),
          onTap: _pickAudioFiles,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Selected Audio Files (${_selectedAudioFiles!.length})',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        ...(_selectedAudioFiles!.map((file) => ListTile(
          leading: Icon(Icons.audiotrack),
          title: Text(file.name),
          subtitle: Text(_formatFileSize(file.size)),
          trailing: IconButton(
            icon: Icon(Icons.close),
            onPressed: () => _removeAudioFile(file),
          ),
        ))),
        TextButton.icon(
          onPressed: _pickAudioFiles,
          icon: Icon(Icons.add),
          label: Text('Add more audio files'),
        ),
      ],
    );
  }
}
```

**Upload with MultipartRequest:**

```dart
Future<void> _uploadChatWithAudio() async {
  final uri = Uri.parse('${apiUrl}/sessions/import-whatsapp-with-audio');
  final request = http.MultipartRequest('POST', uri);

  // Add auth header
  request.headers['Authorization'] = 'Bearer $token';

  // Add chat content
  request.fields['chatContent'] = _chatContent;
  request.fields['fileName'] = _fileName;

  // Add audio files
  if (_selectedAudioFiles != null) {
    for (final file in _selectedAudioFiles!) {
      request.files.add(
        http.MultipartFile.fromBytes(
          'audioFiles',
          file.bytes!,
          filename: file.name,
        ),
      );
    }
  }

  final response = await request.send();
  final responseData = await response.stream.bytesToString();

  if (response.statusCode == 201) {
    // Success - show transcription status
    _showTranscriptionProgress(jsonDecode(responseData));
  }
}
```

**Transcription Progress UI:**

```dart
class TranscriptionProgressDialog extends StatefulWidget {
  final String sessionId;
  final int totalAudioMessages;

  @override
  _TranscriptionProgressDialogState createState() => _TranscriptionProgressDialogState();
}

class _TranscriptionProgressDialogState extends State<TranscriptionProgressDialog> {
  Timer? _pollTimer;
  int _completedCount = 0;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(Duration(seconds: 2), (_) async {
      final status = await _fetchTranscriptionStatus();
      setState(() {
        _completedCount = status.completedCount;
      });

      if (_completedCount >= widget.totalAudioMessages) {
        _pollTimer?.cancel();
        Navigator.of(context).pop();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Transcribing Voice Notes'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(
            value: _completedCount / widget.totalAudioMessages,
          ),
          SizedBox(height: 16),
          Text('$_completedCount / ${widget.totalAudioMessages} completed'),
        ],
      ),
    );
  }
}
```

---

## Cost Analysis

**OpenAI Whisper Pricing (as of 2026-01-10):**
- $0.006 per minute of audio
- Average voice note: 30-60 seconds
- Cost per voice note: ~$0.003 - $0.006

**Example Usage:**
- 20 voice notes in a chat export = ~$0.10
- 100 voice notes = ~$0.50
- 1,000 users × 20 voice notes/month = $200/month

**Optimization Strategies:**
1. Cache transcripts to avoid re-transcription
2. Offer transcription as premium feature
3. Rate limit: max 50 voice notes per chat export
4. Batch processing to optimize API calls

---

## Security & Privacy Considerations

### 1. Data Retention
- **Audio Files:** Delete from `audioBuffer` field after successful transcription
- **Transcripts:** Store only transcripts, not raw audio (aligned with privacy-first principle)
- **User Control:** Add "Delete Voice Transcripts" option

### 2. Encryption
- Encrypt `audioBuffer` field at rest using Prisma field-level encryption
- Encrypt audio files in transit (HTTPS/TLS)

### 3. Consent
- Explicit opt-in: "Include voice note transcriptions in analysis?"
- Privacy notice: "Voice notes will be transcribed using OpenAI Whisper. Audio files are deleted after transcription."

---

## User Experience Flow

### Happy Path

1. **User exports WhatsApp chat with media**
   - Android: Settings → Chats → Chat history → Export chat → Include media
   - iOS: Chat → Contact name → Export Chat → Attach Media

2. **User opens Relationship Referee app**
   - Navigates to "Import WhatsApp Chat"
   - Selects .txt file (chat transcript)
   - Taps "Add Voice Notes (Optional)"
   - Selects .opus/.m4a files from device

3. **Upload & Processing**
   - App uploads chat + audio files
   - Server matches audio files to `<audio omitted>` messages
   - Shows progress: "Matching 12 voice notes... ✓"
   - Shows transcription progress: "Transcribing 12 / 12 voice notes..."

4. **Analysis Ready**
   - Transcript now includes voice note content
   - Analysis runs on complete conversation (text + transcribed audio)
   - Match Report generated with full context

### Error Handling

**Scenario 1: Audio file doesn't match any message**
- Action: Skip file, log warning
- User Notification: "3 audio files couldn't be matched. They were not included in analysis."

**Scenario 2: Transcription fails for 1 voice note**
- Action: Use placeholder "[Audio transcription failed]"
- User Notification: "1 voice note couldn't be transcribed. Analysis continues with remaining messages."

**Scenario 3: No audio files uploaded**
- Action: Proceed with text-only import (existing behavior)
- User Notification: None (optional voice notes)

---

## Testing Strategy

### 1. Unit Tests

```typescript
describe('WhatsAppParserService - Audio Messages', () => {
  it('should detect audio omitted messages', () => {
    const input = '01/15/2024, 10:32 - John: <audio omitted>';
    const result = parser.parseLine(input);
    expect(result.isAudioMessage).toBe(true);
  });

  it('should estimate audio filename from timestamp', () => {
    const timestamp = new Date('2024-01-15');
    const filename = parser.estimateAudioFilename(timestamp);
    expect(filename).toBe('PTT-20240115-WA*');
  });
});

describe('Audio File Matching', () => {
  it('should match audio files by timestamp', () => {
    const messages = [
      { timestamp: new Date('2024-01-15 10:30'), isAudioMessage: true },
      { timestamp: new Date('2024-01-15 10:35'), isAudioMessage: true }
    ];
    const audioFiles = [
      { filename: 'PTT-20240115-WA0001.opus', timestamp: new Date('2024-01-15') }
    ];

    const matches = matchAudioFilesToMessages(messages, audioFiles);
    expect(matches[0].confidence).toBe('HIGH');
  });
});
```

### 2. Integration Tests

```typescript
describe('WhatsApp Import with Audio E2E', () => {
  it('should import chat with voice notes and transcribe', async () => {
    const chatContent = `
      [01/15/2024, 10:30] John: Hey
      [01/15/2024, 10:31] Jane: <audio omitted>
      [01/15/2024, 10:32] John: Sounds good!
    `;

    const audioFile = await fs.readFile('test-fixtures/voice-note.opus');

    const result = await sessionsService.importWhatsAppChatWithAudio(
      userId,
      { chatContent, fileName: 'test.txt' },
      [{ buffer: audioFile, originalname: 'PTT-20240115-WA0001.opus' }]
    );

    expect(result.audioMatches).toHaveLength(1);
    expect(result.transcriptionStatus).toBe('PENDING');

    // Wait for transcription
    await waitForTranscription(result.session.id);

    const session = await prisma.session.findUnique({
      where: { id: result.session.id }
    });

    expect(session.transcript).toContain('Jane: '); // Transcribed content
    expect(session.status).toBe(SessionStatus.UPLOADED);
  });
});
```

### 3. Load Tests

- **Scenario:** 100 concurrent users uploading 20 voice notes each
- **Expected:** Queue handles 2,000 transcription jobs without timeout
- **Metrics:** p95 transcription time < 30 seconds per voice note

---

## Migration Path

### Phase 1: Backend Foundation (Week 1)
- [ ] Update `ParsedMessage` interface to include `isAudioMessage`
- [ ] Create `AudioTranscriptionJob` model
- [ ] Implement audio file matching logic
- [ ] Add `import-whatsapp-with-audio` endpoint

### Phase 2: Transcription Pipeline (Week 1-2)
- [ ] Create BullMQ queue for audio transcription
- [ ] Implement `AudioTranscriptionProcessor`
- [ ] Add transcript rebuilding logic
- [ ] Test with sample WhatsApp exports

### Phase 3: Mobile UI (Week 2)
- [ ] Add audio file picker to import screen
- [ ] Implement multipart upload
- [ ] Add transcription progress dialog
- [ ] Test on iOS and Android

### Phase 4: Testing & Optimization (Week 2-3)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Optimize audio file storage (compression)
- [ ] Add cost monitoring

### Phase 5: Deployment (Week 3)
- [ ] Deploy to staging
- [ ] Beta test with 10 users
- [ ] Monitor costs and performance
- [ ] Deploy to production

---

## Alternative Approaches Considered

### Alternative 1: Client-Side Transcription
**Pros:** No server cost, faster for users
**Cons:** Mobile devices too slow, battery drain, inconsistent quality
**Decision:** Rejected - server-side transcription provides better UX

### Alternative 2: Manual Audio Upload Later
**Pros:** Simpler initial implementation
**Cons:** Poor UX, users unlikely to upload separately
**Decision:** Rejected - integrated flow is essential

### Alternative 3: Store Audio Permanently
**Pros:** Could re-analyze later with improved models
**Cons:** High storage costs, privacy concerns, violates app principle
**Decision:** Rejected - privacy-first approach requires audio deletion

---

## Success Metrics

**Adoption:**
- 30% of WhatsApp imports include voice notes within 3 months
- 50% of users who upload 1 voice note upload 5+ on next import

**Quality:**
- 95% transcription accuracy (measured via user feedback)
- <10% audio file matching errors

**Performance:**
- p95 transcription time < 30 seconds per voice note
- <2% transcription job failures

**Cost:**
- Average cost per session < $0.50
- Total monthly transcription cost < $500 (for 1,000 active users)

---

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| High transcription costs | High | Medium | Rate limits, premium feature gating, cost monitoring |
| Audio file matching fails | Medium | Medium | Multiple matching strategies, manual review UI |
| Slow transcription (user waits) | Medium | Low | Async queue, progress notifications |
| Privacy concerns about audio storage | High | Low | Delete audio after transcription, clear privacy notice |
| OpenAI Whisper API downtime | Medium | Low | Retry logic, fallback message, status updates |

---

## Open Questions

1. **File Size Limits:** Should we limit total audio upload to 50MB? 100MB?
2. **Language Support:** Whisper supports 99 languages - should we auto-detect or ask user?
3. **Speaker Diarization:** Should we attempt to identify which participant is speaking in voice notes?
4. **Emotional Tone Detection:** Should we analyze audio for emotional prosody (anger, sadness, joy)?
5. **Premium Feature:** Should voice note transcription be premium-only or free for all?

---

## Next Steps

1. Review design with team
2. Get user feedback on proposed UX flow
3. Estimate infrastructure costs for expected load
4. Decide on free vs premium feature
5. Create detailed implementation tickets
6. Begin Phase 1 development

---

## References

- [WhatsApp Export Documentation](https://faq.whatsapp.com/1180414079177245)
- [How to Save WhatsApp Audio](https://www.ionos.com/digitalguide/online-marketing/social-media/how-to-save-audio-from-whatsapp/)
- [WhatsApp Audio Download Guide](https://www.tuneskit.com/whatsapp/how-to-download-audio-from-whatsapp.html)
- [OpenAI Whisper API Documentation](https://platform.openai.com/docs/guides/speech-to-text)
- [Reddit: WhatsApp Export Audio Discussion](https://www.reddit.com/r/whatsapp/comments/10h6wfz/whatsapp_export_chat_audio_omitted/)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-10
**Author:** Claude (Business OS Protocol)
