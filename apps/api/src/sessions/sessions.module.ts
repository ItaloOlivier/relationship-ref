import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionQAService } from './services/session-qa.service';
import { CouplesModule } from '@/couples/couples.module';
import { RelationshipsModule } from '@/relationships/relationships.module';
import { AnalysisModule } from '@/analysis/analysis.module';
import { ShareEventsModule } from '@/share-events/share-events.module';
import { WhatsAppParserService } from './services/whatsapp-parser.service';
import { VoiceNoteMatchingService } from './services/voice-note-matching.service';

@Module({
  imports: [
    CouplesModule,
    RelationshipsModule,
    ShareEventsModule,
    forwardRef(() => AnalysisModule),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionQAService, WhatsAppParserService, VoiceNoteMatchingService],
  exports: [SessionsService, SessionQAService, WhatsAppParserService],
})
export class SessionsModule {}
