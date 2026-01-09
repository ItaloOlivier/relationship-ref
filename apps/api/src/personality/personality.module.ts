import { Module } from '@nestjs/common';
import { LinguisticAnalysisService } from './linguistic-analysis.service';
import { AttachmentAnalyzerService } from './attachment-analyzer.service';
import { BigFiveAnalyzerService } from './big-five-analyzer.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    LinguisticAnalysisService,
    AttachmentAnalyzerService,
    BigFiveAnalyzerService,
  ],
  exports: [
    LinguisticAnalysisService,
    AttachmentAnalyzerService,
    BigFiveAnalyzerService,
  ],
})
export class PersonalityModule {}
