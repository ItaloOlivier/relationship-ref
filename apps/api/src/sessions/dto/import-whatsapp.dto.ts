import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportWhatsAppDto {
  @ApiProperty({
    description: 'The raw content of the WhatsApp chat export file',
    example: '[12/01/2024, 14:32:15] John: Hello!\n[12/01/2024, 14:33:02] Sarah: Hi there!',
    minLength: 50,
    maxLength: 5000000, // ~5MB of text
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Chat content is too short. Please export a longer conversation.' })
  @MaxLength(5000000, { message: 'Chat file is too large. Maximum size is 5MB.' })
  chatContent: string;

  @ApiPropertyOptional({
    description: 'Original filename of the exported chat',
    example: 'WhatsApp Chat with Sarah.txt',
  })
  @IsString()
  @IsOptional()
  fileName?: string;
}
