import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCoupleDto {
  @ApiPropertyOptional({ example: 'John & Jane' })
  @IsString()
  @IsOptional()
  name?: string;
}
