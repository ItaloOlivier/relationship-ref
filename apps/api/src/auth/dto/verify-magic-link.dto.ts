import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMagicLinkDto {
  @ApiProperty({
    example: 'abc123xyz',
    description: 'Magic link token from email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
