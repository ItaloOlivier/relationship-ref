import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional({
    description: 'Relationship ID (if not provided, uses first active romantic couple)'
  })
  @IsString()
  @IsOptional()
  relationshipId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether to retain audio after transcription (default: false for privacy)'
  })
  @IsBoolean()
  @IsOptional()
  retainAudio?: boolean;
}
