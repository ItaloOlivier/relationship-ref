import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  console.log('Creating NestJS application...');
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS - allow dashboard and web viewer
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://web-mocha-kappa-28.vercel.app',
        'https://relationship-ref-vercel.app',
        process.env.DASHBOARD_URL || '',
      ].filter(Boolean)
    : ['http://localhost:3001', 'http://localhost:3000', true];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Relationship Referee API')
    .setDescription('API for the Relationship Referee mobile app')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('couples', 'Couple pairing and management')
    .addTag('sessions', 'Coach sessions')
    .addTag('analysis', 'Session analysis and reports')
    .addTag('gamification', 'Quests, streaks, and rewards')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`Application running on ${host}:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Swagger docs available at /api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
