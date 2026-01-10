import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { CouplesModule } from '@/couples/couples.module';
import { RelationshipsModule } from '@/relationships/relationships.module';
import { AnalysisModule } from '@/analysis/analysis.module';
import { WhatsAppParserService } from './services/whatsapp-parser.service';
import { VoiceNoteMatchingService } from './services/voice-note-matching.service';

@Module({
  imports: [
    CouplesModule,
    RelationshipsModule,
    forwardRef(() => AnalysisModule),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, WhatsAppParserService, VoiceNoteMatchingService],
  exports: [SessionsService, WhatsAppParserService],
})
export class SessionsModule {}
