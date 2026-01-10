import { ApiProperty } from '@nestjs/swagger';

/**
 * Sanitized session report for public sharing
 * Excludes sensitive data: audio, full transcript, user IDs
 */
export class SharedReportDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Overall session score (0-100)' })
  overallScore: number;

  @ApiProperty({ description: 'Green card count' })
  greenCardCount: number;

  @ApiProperty({ description: 'Yellow card count' })
  yellowCardCount: number;

  @ApiProperty({ description: 'Red card count' })
  redCardCount: number;

  @ApiProperty({ description: 'Emotional bank change' })
  bankChange: number;

  @ApiProperty({ description: 'Individual scorecards (speakers anonymized if requested)' })
  individualScores?: any[];

  @ApiProperty({ description: 'Topic tags discussed' })
  topicTags: string[];

  @ApiProperty({ description: 'Card details with quotes' })
  cards: any[];

  @ApiProperty({ description: 'What went well feedback' })
  whatWentWell?: string;

  @ApiProperty({ description: 'Try next time feedback' })
  tryNextTime?: string;

  @ApiProperty({ description: 'Repair suggestion' })
  repairSuggestion?: string;

  @ApiProperty({ description: 'Session created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Session source type' })
  sourceType: string;
}
