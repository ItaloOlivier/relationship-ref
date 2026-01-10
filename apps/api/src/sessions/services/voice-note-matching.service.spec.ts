import { Test, TestingModule } from '@nestjs/testing';
import { VoiceNoteMatchingService } from './voice-note-matching.service';
import { ParsedMessage } from './whatsapp-parser.service';

// Type definition for Multer file
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  stream: any;
  destination: string;
  filename: string;
  path: string;
};

describe('VoiceNoteMatchingService', () => {
  let service: VoiceNoteMatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoiceNoteMatchingService],
    }).compile();

    service = module.get<VoiceNoteMatchingService>(VoiceNoteMatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Helper function to create mock file
  const createMockFile = (filename: string): MulterFile => ({
    fieldname: 'voiceNotes',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'audio/opus',
    buffer: Buffer.from('mock audio data'),
    size: 1024,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  });

  // Helper function to create parsed message
  const createMessage = (
    sender: string,
    content: string,
    timestamp: Date,
    isSystemMessage = false
  ): ParsedMessage => ({
    sender,
    content,
    timestamp,
    isSystemMessage,
  });

  describe('matchVoiceNotes', () => {
    it('should return empty map when no files provided', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T14:30:00')),
      ];

      const matches = service.matchVoiceNotes(messages, [] as any);
      expect(matches.size).toBe(0);
    });

    it('should return empty map when no audio messages exist', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', 'Hello', new Date('2024-01-15T14:30:00')),
        createMessage('Sarah', 'Hi there', new Date('2024-01-15T14:31:00')),
      ];

      const files = [createMockFile('PTT-20240115-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);
      expect(matches.size).toBe(0);
    });

    it('should match voice note to audio message with exact date', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', 'Hello', new Date('2024-01-15T14:30:00')),
        createMessage('Sarah', '<audio omitted>', new Date('2024-01-15T14:31:00')),
        createMessage('John', 'How are you?', new Date('2024-01-15T14:32:00')),
      ];

      const files = [createMockFile('PTT-20240115-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(1);
      expect(matches.has(1)).toBe(true); // Index 1 is the audio message
      expect(matches.get(1)?.file.originalname).toBe('PTT-20240115-WA0001.opus');
      expect(matches.get(1)?.confidence).toBe('HIGH');
    });

    it('should match multiple voice notes to multiple audio messages', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T10:00:00')),
        createMessage('Sarah', 'Thanks!', new Date('2024-01-15T10:05:00')),
        createMessage('John', '<audio omitted>', new Date('2024-01-15T14:00:00')),
        createMessage('Sarah', '<audio omitted>', new Date('2024-01-15T18:00:00')),
      ];

      const files = [
        createMockFile('PTT-20240115-WA0001.opus'),
        createMockFile('PTT-20240115-WA0002.opus'),
        createMockFile('PTT-20240115-WA0003.opus'),
      ];

      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(3);
      expect(matches.has(0)).toBe(true);
      expect(matches.has(2)).toBe(true);
      expect(matches.has(3)).toBe(true);
    });

    it('should handle AUD prefix in filename', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T14:30:00')),
      ];

      const files = [createMockFile('AUD-20240115-WA0001.m4a')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(1);
      expect(matches.get(0)?.file.originalname).toBe('AUD-20240115-WA0001.m4a');
    });

    it('should not match files with invalid filename format', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T14:30:00')),
      ];

      const files = [
        createMockFile('invalid-filename.opus'),
        createMockFile('voice-note.m4a'),
      ];

      const matches = service.matchVoiceNotes(messages, files as any);
      expect(matches.size).toBe(0);
    });

    it('should match with timezone tolerance (±1 day)', () => {
      // Message on Jan 15, file dated Jan 14 (within tolerance)
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T01:00:00')),
      ];

      const files = [createMockFile('PTT-20240114-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(1);
      // Should have medium confidence due to date difference
      expect(matches.get(0)?.confidence).toBe('MEDIUM');
    });

    it('should not match files more than 1 day apart', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T14:30:00')),
      ];

      // File dated Jan 10 (5 days apart)
      const files = [createMockFile('PTT-20240110-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(0);
    });

    it('should prefer closer time matches when multiple candidates exist', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T10:00:00')),
        createMessage('Sarah', '<audio omitted>', new Date('2024-01-15T14:00:00')),
      ];

      // Two files on same day
      const files = [
        createMockFile('PTT-20240115-WA0001.opus'),
        createMockFile('PTT-20240115-WA0002.opus'),
      ];

      const matches = service.matchVoiceNotes(messages, files as any);

      // Should match both files to the two messages
      expect(matches.size).toBe(2);
    });

    it('should not reuse already matched files', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-15T10:00:00')),
        createMessage('Sarah', '<audio omitted>', new Date('2024-01-15T10:05:00')),
        createMessage('John', '<audio omitted>', new Date('2024-01-15T10:10:00')),
      ];

      // Only 2 files for 3 audio messages
      const files = [
        createMockFile('PTT-20240115-WA0001.opus'),
        createMockFile('PTT-20240115-WA0002.opus'),
      ];

      const matches = service.matchVoiceNotes(messages, files as any);

      // Should only match 2 out of 3
      expect(matches.size).toBe(2);

      // Verify each file is only used once
      const matchedFiles = Array.from(matches.values()).map(m => m.file.originalname);
      const uniqueFiles = new Set(matchedFiles);
      expect(uniqueFiles.size).toBe(matchedFiles.length);
    });

    it('should handle case-insensitive audio omitted detection', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<Audio Omitted>', new Date('2024-01-15T14:30:00')),
        createMessage('Sarah', '<AUDIO OMITTED>', new Date('2024-01-15T14:31:00')),
      ];

      const files = [
        createMockFile('PTT-20240115-WA0001.opus'),
        createMockFile('PTT-20240115-WA0002.opus'),
      ];

      const matches = service.matchVoiceNotes(messages, files as any);
      expect(matches.size).toBe(2);
    });
  });

  describe('getUnmatchedFiles', () => {
    it('should return all files when none are matched', () => {
      const files = [
        createMockFile('PTT-20240115-WA0001.opus'),
        createMockFile('PTT-20240115-WA0002.opus'),
      ];

      const matches = new Map();
      const unmatched = service.getUnmatchedFiles(files, matches);

      expect(unmatched.length).toBe(2);
    });

    it('should return empty array when all files are matched', () => {
      const files = [
        createMockFile('PTT-20240115-WA0001.opus'),
        createMockFile('PTT-20240115-WA0002.opus'),
      ];

      const matches = new Map([
        [0, { messageIndex: 0, file: files[0], confidence: 'HIGH' as const }],
        [1, { messageIndex: 1, file: files[1], confidence: 'HIGH' as const }],
      ]);

      const unmatched = service.getUnmatchedFiles(files, matches);
      expect(unmatched.length).toBe(0);
    });

    it('should return only unmatched files', () => {
      const files = [
        createMockFile('PTT-20240115-WA0001.opus'),
        createMockFile('PTT-20240115-WA0002.opus'),
        createMockFile('PTT-20240115-WA0003.opus'),
      ];

      const matches = new Map([
        [0, { messageIndex: 0, file: files[0], confidence: 'HIGH' as const }],
        // File at index 1 is not matched
        [2, { messageIndex: 2, file: files[2], confidence: 'HIGH' as const }],
      ]);

      const unmatched = service.getUnmatchedFiles(files, matches);

      expect(unmatched.length).toBe(1);
      expect(unmatched[0].originalname).toBe('PTT-20240115-WA0002.opus');
    });
  });

  describe('Filename metadata extraction', () => {
    it('should extract date and sequence from PTT format', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-12-25T10:00:00')),
      ];

      const files = [createMockFile('PTT-20241225-WA0042.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(1);
    });

    it('should handle leading zeros in sequence numbers', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2024-01-01T10:00:00')),
      ];

      const files = [createMockFile('PTT-20240101-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(1);
    });

    it('should reject dates in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const futureYear = futureDate.getFullYear();
      const futureMonth = String(futureDate.getMonth() + 1).padStart(2, '0');
      const futureDay = String(futureDate.getDate()).padStart(2, '0');

      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date()),
      ];

      const files = [createMockFile(`PTT-${futureYear}${futureMonth}${futureDay}-WA0001.opus`)];
      const matches = service.matchVoiceNotes(messages, files as any);

      // Should not match due to invalid future date
      expect(matches.size).toBe(0);
    });

    it('should reject dates before WhatsApp existed (pre-2009)', () => {
      const messages: ParsedMessage[] = [
        createMessage('John', '<audio omitted>', new Date('2008-01-01T10:00:00')),
      ];

      const files = [createMockFile('PTT-20080101-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty messages array', () => {
      const messages: ParsedMessage[] = [];
      const files = [createMockFile('PTT-20240115-WA0001.opus')];

      const matches = service.matchVoiceNotes(messages, files as any);
      expect(matches.size).toBe(0);
    });

    it('should handle system messages with audio omitted', () => {
      const messages: ParsedMessage[] = [
        createMessage('System', '<audio omitted>', new Date('2024-01-15T14:30:00'), true),
      ];

      const files = [createMockFile('PTT-20240115-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      // System messages should still be matchable
      expect(matches.size).toBe(1);
    });

    it('should handle messages with audio omitted in middle of text', () => {
      const messages: ParsedMessage[] = [
        createMessage(
          'John',
          'Check this out <audio omitted> pretty cool',
          new Date('2024-01-15T14:30:00')
        ),
      ];

      const files = [createMockFile('PTT-20240115-WA0001.opus')];
      const matches = service.matchVoiceNotes(messages, files as any);

      expect(matches.size).toBe(1);
    });
  });
});
