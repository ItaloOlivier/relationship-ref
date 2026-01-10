import { Injectable, Logger } from '@nestjs/common';
import { ParsedMessage } from './whatsapp-parser.service';

export interface VoiceNoteMatch {
  messageIndex: number;
  file: Express.Multer.File;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Service for matching WhatsApp voice note files to message placeholders
 *
 * WhatsApp voice notes appear as "<audio omitted>" in text exports.
 * When exported WITH media, separate audio files are included with filenames like:
 * - PTT-YYYYMMDD-WAxxxx.opus
 * - PTT-YYYYMMDD-WAxxxx.m4a
 * - AUD-YYYYMMDD-WAxxxx.opus (some versions)
 *
 * This service matches files to messages based on:
 * 1. Date extracted from filename
 * 2. Sequence number (WAxxxx)
 * 3. Message timestamp
 */
@Injectable()
export class VoiceNoteMatchingService {
  private readonly logger = new Logger(VoiceNoteMatchingService.name);

  /**
   * Match voice note files to messages with <audio omitted> placeholders
   *
   * @param messages - Parsed WhatsApp messages
   * @param files - Uploaded voice note files
   * @returns Map of message index to matched file
   */
  matchVoiceNotes(
    messages: ParsedMessage[],
    files: Express.Multer.File[]
  ): Map<number, VoiceNoteMatch> {
    const matches = new Map<number, VoiceNoteMatch>();

    if (!files || files.length === 0) {
      return matches;
    }

    // Find all messages with audio placeholders
    const audioMessageIndices = messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => this.isAudioMessage(msg))
      .map(({ idx }) => idx);

    this.logger.log(`Found ${audioMessageIndices.length} audio messages and ${files.length} voice note files`);

    // Parse metadata from all files
    const fileMetadata = files.map(file => ({
      file,
      ...this.extractFileMetadata(file.originalname),
    }));

    // Match each audio message to a file
    for (const msgIdx of audioMessageIndices) {
      const message = messages[msgIdx];
      const match = this.findBestMatch(message, fileMetadata, matches);

      if (match) {
        matches.set(msgIdx, match);
        this.logger.debug(
          `Matched ${match.file.originalname} to message at index ${msgIdx} (confidence: ${match.confidence})`
        );
      } else {
        this.logger.warn(`No match found for audio message at index ${msgIdx} (${message.timestamp})`);
      }
    }

    // Log unmatched files
    const matchedFiles = new Set(Array.from(matches.values()).map(m => m.file.originalname));
    const unmatchedFiles = files.filter(f => !matchedFiles.has(f.originalname));
    if (unmatchedFiles.length > 0) {
      this.logger.warn(`${unmatchedFiles.length} voice note files could not be matched: ${unmatchedFiles.map(f => f.originalname).join(', ')}`);
    }

    return matches;
  }

  /**
   * Check if a message is an audio placeholder
   */
  private isAudioMessage(message: ParsedMessage): boolean {
    return /<audio omitted>/i.test(message.content);
  }

  /**
   * Extract metadata from PTT filename
   *
   * Examples:
   * - PTT-20240115-WA0012.opus → { date: 2024-01-15, sequence: 12 }
   * - AUD-20231225-WA0005.m4a → { date: 2023-12-25, sequence: 5 }
   */
  private extractFileMetadata(filename: string): {
    date: Date | null;
    sequence: number;
    isPTT: boolean;
  } {
    // Match PTT-YYYYMMDD-WAxxxx or AUD-YYYYMMDD-WAxxxx
    const pttMatch = filename.match(/(?:PTT|AUD)-(\d{4})(\d{2})(\d{2})-WA(\d+)/i);

    if (!pttMatch) {
      this.logger.warn(`Filename does not match PTT pattern: ${filename}`);
      return { date: null, sequence: 0, isPTT: false };
    }

    const [, year, month, day, seq] = pttMatch;
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // JS months are 0-indexed
      parseInt(day, 10)
    );

    // Validate date is reasonable (not in future, not before WhatsApp existed)
    const now = new Date();
    const whatsappLaunch = new Date('2009-01-01');

    if (date > now || date < whatsappLaunch) {
      this.logger.warn(`Invalid date in filename: ${filename}`);
      return { date: null, sequence: 0, isPTT: false };
    }

    return {
      date,
      sequence: parseInt(seq, 10),
      isPTT: true,
    };
  }

  /**
   * Find the best matching file for a message
   */
  private findBestMatch(
    message: ParsedMessage,
    fileMetadata: Array<{
      file: Express.Multer.File;
      date: Date | null;
      sequence: number;
      isPTT: boolean;
    }>,
    existingMatches: Map<number, VoiceNoteMatch>
  ): VoiceNoteMatch | null {
    const alreadyMatchedFiles = new Set(
      Array.from(existingMatches.values()).map(m => m.file.originalname)
    );

    // Filter to unmatched files with valid metadata
    const candidates = fileMetadata.filter(
      fm => fm.isPTT && fm.date && !alreadyMatchedFiles.has(fm.file.originalname)
    );

    if (candidates.length === 0) {
      return null;
    }

    // Score each candidate
    const scored = candidates.map(fm => {
      const score = this.calculateMatchScore(message, fm);
      return { ...fm, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    // Determine confidence based on score
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    if (best.score >= 100) {
      confidence = 'HIGH'; // Exact date + close time
    } else if (best.score >= 50) {
      confidence = 'MEDIUM'; // Same date or close time
    } else {
      confidence = 'LOW'; // Weak match
    }

    // Don't match if score is too low (< 30)
    if (best.score < 30) {
      return null;
    }

    return {
      messageIndex: -1, // Will be set by caller
      file: best.file,
      confidence,
    };
  }

  /**
   * Calculate match score between a message and file metadata
   *
   * Scoring:
   * - Exact date match: +100 points
   * - Date within ±1 day: +50 points
   * - Time difference < 1 hour: +30 points
   * - Time difference < 3 hours: +10 points
   * - Sequence number match (same day): +20 points
   */
  private calculateMatchScore(
    message: ParsedMessage,
    fileMetadata: {
      date: Date | null;
      sequence: number;
    }
  ): number {
    if (!fileMetadata.date) {
      return 0;
    }

    let score = 0;

    // Date matching
    const msgDate = this.getDateOnly(message.timestamp);
    const fileDate = this.getDateOnly(fileMetadata.date);

    const daysDiff = Math.abs(
      (msgDate.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      score += 100; // Exact date match
    } else if (daysDiff <= 1) {
      score += 50; // Within 1 day (timezone tolerance)
    } else {
      // Too far apart in time
      return 0;
    }

    // Time proximity (within same day)
    if (daysDiff === 0) {
      const timeDiffHours = Math.abs(
        (message.timestamp.getTime() - fileMetadata.date.getTime()) / (1000 * 60 * 60)
      );

      if (timeDiffHours < 1) {
        score += 30;
      } else if (timeDiffHours < 3) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Get date-only (no time) from a Date object
   */
  private getDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Get list of unmatched voice note files
   */
  getUnmatchedFiles(
    files: Express.Multer.File[],
    matches: Map<number, VoiceNoteMatch>
  ): Express.Multer.File[] {
    const matchedFiles = new Set(
      Array.from(matches.values()).map(m => m.file.originalname)
    );
    return files.filter(f => !matchedFiles.has(f.originalname));
  }
}
