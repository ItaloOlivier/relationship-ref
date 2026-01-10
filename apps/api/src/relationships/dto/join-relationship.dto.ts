import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRelationshipDto {
  @ApiProperty({
    description: 'Invite code to join the relationship',
  })
  @IsString()
  inviteCode: string;

  @ApiProperty({
    required: false,
    description: 'Optional role in the relationship (e.g., "manager", "employee", "parent", "child")',
  })
  @IsString()
  @IsOptional()
  role?: string;
}
