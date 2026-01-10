import { Module } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { RelationshipsController } from './relationships.controller';
import { PrismaService } from '@/common/prisma/prisma.service';

@Module({
  controllers: [RelationshipsController],
  providers: [RelationshipsService, PrismaService],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
