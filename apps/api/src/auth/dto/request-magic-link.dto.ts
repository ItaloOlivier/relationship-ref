import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestMagicLinkDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send magic link to',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
