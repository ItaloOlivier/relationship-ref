import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinCoupleDto {
  @ApiProperty({ example: 'ABC12345', description: '8-character invite code' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  inviteCode: string;
}
