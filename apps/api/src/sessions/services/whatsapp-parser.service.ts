import { Injectable, BadRequestException } from '@nestjs/common';

export interface ParsedMessage {
  timestamp: Date;
  sender: string;
  content: string;
  isSystemMessage: boolean;
}

export interface ParsedChat {
  messages: ParsedMessage[];
  participants: string[];
  startDate: Date | null;
  endDate: Date | null;
  messageCount: number;
}

/**
 * Service to parse WhatsApp chat export files (.txt format)
 *
 * WhatsApp exports chats in various formats depending on:
 * - Platform (iOS vs Android)
 * - Regional date format settings
 * - WhatsApp version
 *
 * Common formats:
 * - [DD/MM/YYYY, HH:MM:SS] Sender: Message
 * - [MM/DD/YYYY, HH:MM:SS] Sender: Message
 * - DD/MM/YYYY, HH:MM - Sender: Message
 * - [DD/MM/YY, HH:MM:SS] Sender: Message
 */
@Injectable()
export class WhatsAppParserService {
  // Regex patterns for different WhatsApp export formats
  private readonly MESSAGE_PATTERNS = [
    // Format: [DD/MM/YYYY, HH:MM:SS] Sender: Message (iOS)
    /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s+([^:]+):\s*(.*)$/i,

    // Format: DD/MM/YYYY, HH:MM - Sender: Message (Android)
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*[-–]\s*([^:]+):\s*(.*)$/i,

    // Format: YYYY-MM-DD, HH:MM - Sender: Message (some regions)
    /^(\d{4}-\d{2}-\d{2}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*([^:]+):\s*(.*)$/i,

    // Format: DD.MM.YYYY, HH:MM - Sender: Message (European)
    /^(\d{1,2}\.\d{1,2}\.\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*([^:]+):\s*(.*)$/i,
  ];

  // System message patterns (not from participants)
  private readonly SYSTEM_MESSAGE_PATTERNS = [
    /messages and calls are end-to-end encrypted/i,
    /created group/i,
    /added you/i,
    /left the group/i,
    /changed the subject/i,
    /changed this group's icon/i,
    /changed the group description/i,
    /deleted this message/i,
    /this message was deleted/i,
    /<media omitted>/i,
    /missed voice call/i,
    /missed video call/i,
    /sticker omitted/i,
    /gif omitted/i,
    /image omitted/i,
    /video omitted/i,
    /audio omitted/i,
    /document omitted/i,
    /contact card omitted/i,
    /location:/i,
    /live location shared/i,
  ];

  /**
   * Parse a WhatsApp chat export file content
   */
  parseChat(content: string): ParsedChat {
    if (!content || typeof content !== 'string') {
      throw new BadRequestException('Invalid chat content provided');
    }

    // Normalize line endings
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.split('\n');

    if (lines.length === 0) {
      throw new BadRequestException('Empty chat file');
    }

    const messages: ParsedMessage[] = [];
    const participantSet = new Set<string>();
    let currentMessage: ParsedMessage | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const parsed = this.parseLine(trimmedLine);

      if (parsed) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }

        currentMessage = parsed;

        // Track participants (exclude system messages)
        if (!parsed.isSystemMessage) {
          participantSet.add(parsed.sender);
        }
      } else if (currentMessage) {
        // Multi-line message continuation
        currentMessage.content += '\n' + trimmedLine;
      }
    }

    // Don't forget the last message
    if (currentMessage) {
      messages.push(currentMessage);
    }

    if (messages.length === 0) {
      throw new BadRequestException(
        'Could not parse any messages from the file. Please ensure this is a valid WhatsApp chat export.',
      );
    }

    // Filter out system messages for participant counting
    const userMessages = messages.filter(m => !m.isSystemMessage);
    const participants = Array.from(participantSet);

    // Validate we have at least 2 participants for a couple conversation
    if (participants.length < 2) {
      throw new BadRequestException(
        `Found only ${participants.length} participant(s). A couple\'s conversation requires at least 2 participants.`,
      );
    }

    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      messages,
      participants,
      startDate: messages.length > 0 ? messages[0].timestamp : null,
      endDate: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
      messageCount: userMessages.length,
    };
  }

  /**
   * Parse a single line from the chat export
   */
  private parseLine(line: string): ParsedMessage | null {
    for (const pattern of this.MESSAGE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, timeStr, sender, content] = match;
        const timestamp = this.parseDateTime(dateStr, timeStr);

        if (timestamp) {
          const isSystem = this.isSystemMessage(sender, content);
          return {
            timestamp,
            sender: sender.trim(),
            content: content.trim(),
            isSystemMessage: isSystem,
          };
        }
      }
    }

    return null;
  }

  /**
   * Parse date and time strings into a Date object
   */
  private parseDateTime(dateStr: string, timeStr: string): Date | null {
    try {
      // Try different date formats
      let day: number, month: number, year: number;

      // Format: YYYY-MM-DD
      if (dateStr.includes('-') && dateStr.indexOf('-') === 4) {
        const parts = dateStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
      // Format: DD/MM/YYYY or MM/DD/YYYY or DD.MM.YYYY
      else {
        const separator = dateStr.includes('.') ? '.' : '/';
        const parts = dateStr.split(separator);

        // Determine if DD/MM or MM/DD format
        // If first number > 12, it must be day
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        const third = parseInt(parts[2], 10);

        if (first > 12) {
          // DD/MM/YYYY format
          day = first;
          month = second;
        } else if (second > 12) {
          // MM/DD/YYYY format
          month = first;
          day = second;
        } else {
          // Ambiguous - assume DD/MM/YYYY (more common internationally)
          day = first;
          month = second;
        }

        // Handle 2-digit years
        year = third < 100 ? 2000 + third : third;
      }

      // Parse time
      let hours = 0, minutes = 0, seconds = 0;
      const timeParts = timeStr.trim().toUpperCase();
      const isPM = timeParts.includes('PM');
      const isAM = timeParts.includes('AM');

      const cleanTime = timeParts.replace(/\s*(AM|PM)\s*/gi, '').trim();
      const timeComponents = cleanTime.split(':');

      hours = parseInt(timeComponents[0], 10);
      minutes = parseInt(timeComponents[1], 10);
      if (timeComponents[2]) {
        seconds = parseInt(timeComponents[2], 10);
      }

      // Handle 12-hour format
      if (isPM && hours < 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      }

      const date = new Date(year, month - 1, day, hours, minutes, seconds);

      // Validate the date is reasonable (not in the future, not before WhatsApp existed)
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch {
      return null;
    }
  }

  /**
   * Check if a message is a system message
   */
  private isSystemMessage(sender: string, content: string): boolean {
    const fullText = `${sender}: ${content}`;

    for (const pattern of this.SYSTEM_MESSAGE_PATTERNS) {
      if (pattern.test(fullText)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert parsed messages to a transcript format suitable for analysis
   */
  formatAsTranscript(parsedChat: ParsedChat): string {
    return parsedChat.messages
      .filter(m => !m.isSystemMessage)
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');
  }

  /**
   * Calculate approximate conversation duration based on message timestamps
   */
  calculateDuration(parsedChat: ParsedChat): number | null {
    if (!parsedChat.startDate || !parsedChat.endDate) {
      return null;
    }

    const durationMs = parsedChat.endDate.getTime() - parsedChat.startDate.getTime();
    return Math.round(durationMs / 1000); // Convert to seconds
  }
}
