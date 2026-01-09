import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TranscribeSessionDto {
  @ApiPropertyOptional({
    description: 'URL to audio file (if not already set on session)',
    example: 'https://storage.example.com/audio/session-123.mp3'
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  audioUrl?: string;
}
