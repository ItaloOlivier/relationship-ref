import { Module } from '@nestjs/common';
import { LinguisticAnalysisService } from './linguistic-analysis.service';
import { AttachmentAnalyzerService } from './attachment-analyzer.service';
import { BigFiveAnalyzerService } from './big-five-analyzer.service';
import { RelationshipDynamicsService } from './relationship-dynamics.service';
import { ProfileAggregatorService } from './profile-aggregator.service';
import { PersonalityController } from './personality.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalityController],
  providers: [
    LinguisticAnalysisService,
    AttachmentAnalyzerService,
    BigFiveAnalyzerService,
    RelationshipDynamicsService,
    ProfileAggregatorService,
  ],
  exports: [
    LinguisticAnalysisService,
    AttachmentAnalyzerService,
    BigFiveAnalyzerService,
    RelationshipDynamicsService,
    ProfileAggregatorService,
  ],
})
export class PersonalityModule {}
