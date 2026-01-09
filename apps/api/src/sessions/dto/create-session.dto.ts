import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Whether to retain audio after transcription (default: false for privacy)'
  })
  @IsBoolean()
  @IsOptional()
  retainAudio?: boolean;
}
