import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LeaveRelationshipDto {
  @ApiProperty({
    required: false,
    description: 'Optional reason for leaving',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
