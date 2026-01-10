import { IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShareLinkDto {
  @ApiProperty({
    description: 'Number of days until link expires',
    minimum: 1,
    maximum: 30,
    default: 7,
    example: 7,
  })
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  expiryDays?: number = 7;

  @ApiProperty({
    description: 'Anonymize speaker names in shared report',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  anonymize?: boolean = false;
}
