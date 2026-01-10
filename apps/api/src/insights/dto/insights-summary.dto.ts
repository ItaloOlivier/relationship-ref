import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopicMetricDto {
  @ApiProperty({ description: 'Topic name' })
  topic: string;

  @ApiProperty({ description: 'Number of sessions with this topic' })
  count: number;

  @ApiProperty({ description: 'Average score for sessions with this topic' })
  averageScore: number;
}

export class TrendDataPointDto {
  @ApiProperty({ description: 'Time period (e.g., "2026-01")' })
  period: string;

  @ApiProperty({ description: 'Value for this period' })
  value: number;

  @ApiProperty({ description: 'Number of data points in this period' })
  count: number;
}

export class InsightsSummaryDto {
  @ApiProperty({ description: 'Total sessions analyzed' })
  totalSessions: number;

  @ApiProperty({ description: 'Average session score' })
  averageScore: number;

  @ApiProperty({ description: 'Score trend direction', enum: ['improving', 'stable', 'declining'] })
  scoreTrend: 'improving' | 'stable' | 'declining';

  @ApiProperty({ description: 'Most common topics', type: [TopicMetricDto] })
  topTopics: TopicMetricDto[];

  @ApiProperty({ description: 'Topics that tend to cause lower scores', type: [TopicMetricDto] })
  triggerTopics: TopicMetricDto[];

  @ApiProperty({ description: 'Four Horsemen frequency' })
  horsemenFrequency: Record<string, number>;

  @ApiProperty({ description: 'Average repair attempts per session' })
  averageRepairAttempts: number;

  @ApiProperty({ description: 'Green card ratio (0-1)' })
  greenCardRatio: number;

  @ApiProperty({ description: 'Monthly score trend', type: [TrendDataPointDto] })
  monthlyTrend: TrendDataPointDto[];

  @ApiProperty({ description: 'Number of active pattern insights' })
  activePatternCount: number;

  @ApiProperty({ description: 'Highest impact pattern (if any)' })
  @ApiPropertyOptional()
  highestImpactPattern?: {
    id: string;
    title: string;
    impact: string;
  };
}
