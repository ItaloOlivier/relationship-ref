import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { CouplesModule } from '@/couples/couples.module';
import { WhatsAppParserService } from './services/whatsapp-parser.service';

@Module({
  imports: [CouplesModule],
  controllers: [SessionsController],
  providers: [SessionsService, WhatsAppParserService],
  exports: [SessionsService, WhatsAppParserService],
})
export class SessionsModule {}
