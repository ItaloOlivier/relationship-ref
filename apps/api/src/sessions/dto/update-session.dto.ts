import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';

export class UpdateSessionDto {
  @ApiPropertyOptional({ enum: SessionStatus })
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @ApiPropertyOptional({ example: 300, description: 'Session duration in seconds' })
  @IsInt()
  @IsOptional()
  durationSecs?: number;

  @ApiPropertyOptional({ description: 'Audio URL if retained' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Transcribed text' })
  @IsString()
  @IsOptional()
  transcript?: string;
}
