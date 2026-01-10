import { Module } from '@nestjs/common';
import { ShareEventsService } from './share-events.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ShareEventsService],
  exports: [ShareEventsService],
})
export class ShareEventsModule {}
