import { Module } from '@nestjs/common';
import { LinguisticAnalysisService } from './linguistic-analysis.service';
import { AttachmentAnalyzerService } from './attachment-analyzer.service';
import { BigFiveAnalyzerService } from './big-five-analyzer.service';
import { RelationshipDynamicsService } from './relationship-dynamics.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    LinguisticAnalysisService,
    AttachmentAnalyzerService,
    BigFiveAnalyzerService,
    RelationshipDynamicsService,
  ],
  exports: [
    LinguisticAnalysisService,
    AttachmentAnalyzerService,
    BigFiveAnalyzerService,
    RelationshipDynamicsService,
  ],
})
export class PersonalityModule {}
