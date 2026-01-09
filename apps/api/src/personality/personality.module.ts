import { Module } from '@nestjs/common';
import { LinguisticAnalysisService } from './linguistic-analysis.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LinguisticAnalysisService],
  exports: [LinguisticAnalysisService],
})
export class PersonalityModule {}
