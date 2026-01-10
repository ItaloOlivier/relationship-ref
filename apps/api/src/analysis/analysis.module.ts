import { Module, forwardRef } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { TranscriptionService } from './transcription.service';
import { ScoringService } from './scoring.service';
import { SessionsModule } from '@/sessions/sessions.module';

@Module({
  imports: [forwardRef(() => SessionsModule)],
  controllers: [AnalysisController],
  providers: [AnalysisService, TranscriptionService, ScoringService],
  exports: [AnalysisService, TranscriptionService],
})
export class AnalysisModule {}
