import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskQuestionDto {
  @ApiProperty({
    description: 'The question to ask about the session',
    example: 'Why did the fight start?',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Question cannot be empty' })
  @MaxLength(500, { message: 'Question must be 500 characters or less' })
  question: string;
}
