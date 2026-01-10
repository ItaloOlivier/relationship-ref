import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetPatternsQueryDto {
  @ApiPropertyOptional({ description: 'Include acknowledged patterns' })
  @IsBoolean()
  @IsOptional()
  includeAcknowledged?: boolean;

  @ApiPropertyOptional({ description: 'Include dismissed patterns' })
  @IsBoolean()
  @IsOptional()
  includeDismissed?: boolean;
}

export class PatternInsightResponseDto {
  @ApiProperty({ description: 'Pattern ID' })
  id: string;

  @ApiProperty({ enum: ['TOPIC_TRIGGER', 'TIME_PATTERN', 'BEHAVIOR_TREND', 'HORSEMAN_TREND', 'COMMUNICATION_STYLE', 'POSITIVE_PATTERN'] })
  patternType: string;

  @ApiProperty({ description: 'Category of the pattern' })
  category: string;

  @ApiProperty({ description: 'Human-readable title' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the pattern' })
  description: string;

  @ApiProperty({ description: 'Supporting evidence data' })
  evidence: any;

  @ApiProperty({ description: 'Confidence score 0-1' })
  confidence: number;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Impact level' })
  impact: string;

  @ApiProperty({ description: 'Number of sessions showing this pattern' })
  sessionsCount: number;

  @ApiProperty({ description: 'Whether user has seen this pattern' })
  acknowledged: boolean;

  @ApiProperty({ description: 'Whether user dismissed this pattern' })
  dismissed: boolean;

  @ApiPropertyOptional({ description: 'When pattern was first detected' })
  firstOccurrence?: Date;

  @ApiPropertyOptional({ description: 'Most recent occurrence' })
  lastOccurrence?: Date;

  @ApiProperty({ description: 'When pattern was created' })
  createdAt: Date;
}
