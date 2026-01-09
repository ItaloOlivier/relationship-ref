import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WhatsAppParserService } from './whatsapp-parser.service';

describe('WhatsAppParserService', () => {
  let service: WhatsAppParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsAppParserService],
    }).compile();

    service = module.get<WhatsAppParserService>(WhatsAppParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseChat', () => {
    it('should parse iOS format [DD/MM/YYYY, HH:MM:SS]', () => {
      const content = `[12/01/2024, 14:32:15] John: Hello, how are you?
[12/01/2024, 14:33:02] Sarah: I'm doing well, thanks for asking!
[12/01/2024, 14:34:18] John: That's great to hear.`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(3);
      expect(result.participants).toContain('John');
      expect(result.participants).toContain('Sarah');
      expect(result.participants.length).toBe(2);
      expect(result.messages[0].sender).toBe('John');
      expect(result.messages[0].content).toBe('Hello, how are you?');
    });

    it('should parse Android format DD/MM/YYYY, HH:MM - Sender:', () => {
      const content = `12/01/2024, 14:32 - John: Hello there
12/01/2024, 14:33 - Sarah: Hi John!
12/01/2024, 14:35 - John: How was your day?`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(3);
      expect(result.participants).toContain('John');
      expect(result.participants).toContain('Sarah');
    });

    it('should parse European format with dots DD.MM.YYYY', () => {
      const content = `12.01.2024, 14:32 - John: Hallo
12.01.2024, 14:33 - Maria: Guten Tag`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(2);
      expect(result.participants).toContain('John');
      expect(result.participants).toContain('Maria');
    });

    it('should parse 12-hour format with AM/PM', () => {
      const content = `[12/01/2024, 2:32:15 PM] John: Good afternoon
[12/01/2024, 2:33:02 PM] Sarah: Hi there!`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(2);
      expect(result.messages[0].timestamp.getHours()).toBe(14); // 2 PM = 14:00
    });

    it('should handle multi-line messages', () => {
      const content = `[12/01/2024, 14:32:15] John: This is a message
that spans multiple
lines in the export
[12/01/2024, 14:33:02] Sarah: Got it!`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(2);
      expect(result.messages[0].content).toContain('spans multiple');
      expect(result.messages[0].content).toContain('lines in the export');
    });

    it('should filter out system messages', () => {
      // Note: System messages like encryption notice don't follow sender: message format
      // so they won't be parsed. Media omitted messages DO have a sender but are marked as system.
      const content = `[12/01/2024, 14:30:00] John: Hey
[12/01/2024, 14:31:00] Sarah: Hi!
[12/01/2024, 14:32:00] John: <Media omitted>`;

      const result = service.parseChat(content);

      // Should have 3 messages total but messageCount only counts non-system
      expect(result.messages.length).toBe(3);
      expect(result.messageCount).toBe(2); // Only "Hey" and "Hi!" (media omitted is system)
      expect(result.participants.length).toBe(2);
    });

    it('should throw error for empty content', () => {
      expect(() => service.parseChat('')).toThrow(BadRequestException);
    });

    it('should throw error for invalid content', () => {
      expect(() => service.parseChat('This is not a WhatsApp export')).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for single participant', () => {
      const content = `[12/01/2024, 14:32:15] John: Hello
[12/01/2024, 14:33:02] John: Anyone there?`;

      expect(() => service.parseChat(content)).toThrow(BadRequestException);
    });

    it('should sort messages by timestamp', () => {
      const content = `[12/01/2024, 14:35:00] John: Third message
[12/01/2024, 14:32:00] Sarah: First message
[12/01/2024, 14:33:00] John: Second message`;

      const result = service.parseChat(content);

      expect(result.messages[0].content).toBe('First message');
      expect(result.messages[1].content).toBe('Second message');
      expect(result.messages[2].content).toBe('Third message');
    });

    it('should handle two-digit years', () => {
      const content = `[12/01/24, 14:32:15] John: Hello
[12/01/24, 14:33:02] Sarah: Hi!`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(2);
      expect(result.messages[0].timestamp.getFullYear()).toBe(2024);
    });

    it('should detect start and end dates', () => {
      const content = `[10/01/2024, 10:00:00] John: Morning!
[10/01/2024, 12:00:00] Sarah: Lunch time
[10/01/2024, 18:00:00] John: Evening`;

      const result = service.parseChat(content);

      expect(result.startDate).toBeTruthy();
      expect(result.endDate).toBeTruthy();
      expect(result.startDate!.getHours()).toBe(10);
      expect(result.endDate!.getHours()).toBe(18);
    });
  });

  describe('formatAsTranscript', () => {
    it('should format messages as transcript', () => {
      const content = `[12/01/2024, 14:32:15] John: Hello
[12/01/2024, 14:33:02] Sarah: Hi there!`;

      const parsedChat = service.parseChat(content);
      const transcript = service.formatAsTranscript(parsedChat);

      expect(transcript).toBe('John: Hello\nSarah: Hi there!');
    });

    it('should exclude system messages from transcript', () => {
      const content = `[12/01/2024, 14:32:15] John: Hello
[12/01/2024, 14:32:30] System: Messages and calls are end-to-end encrypted
[12/01/2024, 14:33:02] Sarah: Hi!`;

      const parsedChat = service.parseChat(content);
      const transcript = service.formatAsTranscript(parsedChat);

      expect(transcript).not.toContain('encrypted');
      expect(transcript).toBe('John: Hello\nSarah: Hi!');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate conversation duration in seconds', () => {
      const content = `[12/01/2024, 14:00:00] John: Start
[12/01/2024, 14:05:00] Sarah: End`;

      const parsedChat = service.parseChat(content);
      const duration = service.calculateDuration(parsedChat);

      expect(duration).toBe(300); // 5 minutes = 300 seconds
    });

    it('should return null for empty chat', () => {
      const parsedChat = {
        messages: [],
        participants: [],
        startDate: null,
        endDate: null,
        messageCount: 0,
      };

      const duration = service.calculateDuration(parsedChat);

      expect(duration).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle messages with colons in content', () => {
      const content = `[12/01/2024, 14:32:15] John: Meeting time: 3:00 PM
[12/01/2024, 14:33:02] Sarah: Got it: I'll be there`;

      const result = service.parseChat(content);

      expect(result.messages[0].content).toBe('Meeting time: 3:00 PM');
      expect(result.messages[1].content).toBe("Got it: I'll be there");
    });

    it('should handle messages with emojis', () => {
      const content = `[12/01/2024, 14:32:15] John: Hello! \\ud83d\\ude00
[12/01/2024, 14:33:02] Sarah: Hi! \\u2764\\ufe0f`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(2);
    });

    it('should handle special characters in sender names', () => {
      const content = `[12/01/2024, 14:32:15] John O'Brien: Hello
[12/01/2024, 14:33:02] Mary-Jane Watson: Hi there!`;

      const result = service.parseChat(content);

      expect(result.participants).toContain("John O'Brien");
      expect(result.participants).toContain('Mary-Jane Watson');
    });

    it('should handle Windows line endings (CRLF)', () => {
      const content = `[12/01/2024, 14:32:15] John: Hello\r\n[12/01/2024, 14:33:02] Sarah: Hi!`;

      const result = service.parseChat(content);

      expect(result.messageCount).toBe(2);
    });

    it('should handle phone numbers as sender names', () => {
      const content = `[12/01/2024, 14:32:15] +1 555-123-4567: Hello
[12/01/2024, 14:33:02] +1 555-987-6543: Hi!`;

      const result = service.parseChat(content);

      expect(result.participants.length).toBe(2);
      expect(result.participants).toContain('+1 555-123-4567');
    });
  });
});
