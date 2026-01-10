import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CouplesModule } from './couples/couples.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { SessionsModule } from './sessions/sessions.module';
import { AnalysisModule } from './analysis/analysis.module';
import { GamificationModule } from './gamification/gamification.module';
import { PersonalityModule } from './personality/personality.module';
import { InsightsModule } from './insights/insights.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
      limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CouplesModule,
    RelationshipsModule,
    SessionsModule,
    AnalysisModule,
    GamificationModule,
    PersonalityModule,
    InsightsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
