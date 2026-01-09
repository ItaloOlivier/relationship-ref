import { Module } from '@nestjs/common';
import { LinguisticAnalysisService } from './linguistic-analysis.service';
import { AttachmentAnalyzerService } from './attachment-analyzer.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LinguisticAnalysisService, AttachmentAnalyzerService],
  exports: [LinguisticAnalysisService, AttachmentAnalyzerService],
})
export class PersonalityModule {}
