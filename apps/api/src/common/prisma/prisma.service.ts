import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in order respecting foreign keys
    await this.questProgress.deleteMany();
    await this.quest.deleteMany();
    await this.streak.deleteMany();
    await this.weeklyReport.deleteMany();
    await this.emotionalBankEntry.deleteMany();
    await this.emotionalBankLedger.deleteMany();
    await this.analysisResult.deleteMany();
    await this.session.deleteMany();
    await this.couple.deleteMany();
    await this.magicLink.deleteMany();
    await this.user.deleteMany();
  }
}
