import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipStatus } from '@prisma/client';

export class UpdateRelationshipStatusDto {
  @ApiProperty({
    enum: RelationshipStatus,
    description: 'New status for the relationship',
  })
  @IsEnum(RelationshipStatus)
  status: RelationshipStatus;

  @ApiProperty({
    required: false,
    description: 'Reason for status change',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
