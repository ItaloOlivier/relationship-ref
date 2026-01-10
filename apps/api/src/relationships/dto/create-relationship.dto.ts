import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipType } from '@prisma/client';

export class CreateRelationshipDto {
  @ApiProperty({
    enum: RelationshipType,
    default: RelationshipType.ROMANTIC_COUPLE,
    description: 'Type of relationship',
  })
  @IsEnum(RelationshipType)
  @IsOptional()
  type?: RelationshipType;

  @ApiProperty({
    required: false,
    description: 'Optional display name for the relationship',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
