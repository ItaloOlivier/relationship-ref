import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { PatternRecognitionService } from './pattern-recognition.service';

@Module({
  controllers: [InsightsController],
  providers: [InsightsService, PatternRecognitionService],
  exports: [InsightsService, PatternRecognitionService],
})
export class InsightsModule {}
