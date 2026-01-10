import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('WhatsApp Import (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testCoupleId: string;

  const validChatContent = `[12/01/2024, 14:32:15] John: Hello, how are you doing today?
[12/01/2024, 14:33:02] Sarah: I'm doing well, thanks for asking! How about you?
[12/01/2024, 14:34:18] John: Pretty good. I wanted to talk about our weekend plans.
[12/01/2024, 14:35:00] Sarah: Sure, what did you have in mind?
[12/01/2024, 14:36:12] John: I appreciate you being open to discussing this.
[12/01/2024, 14:37:30] Sarah: Of course! I understand it's important to you.`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
    await app.init();

    // Create test user and couple
    const user1 = await prisma.user.create({
      data: {
        email: 'whatsapp-test-user1@example.com',
        name: 'Test User 1',
        passwordHash: '$2b$10$rOvHPxfzO4iHsqRxNxCjKuGvJvSqsJJxXJlPtOLDrNuRvKgPAqWUy', // "password123"
      },
    });
    testUserId = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'whatsapp-test-user2@example.com',
        name: 'Test User 2',
        passwordHash: '$2b$10$rOvHPxfzO4iHsqRxNxCjKuGvJvSqsJJxXJlPtOLDrNuRvKgPAqWUy', // "password123"
      },
    });

    const couple = await prisma.couple.create({
      data: {
        inviteCode: 'TESTCODE',
        partner1Id: user1.id,
        partner2Id: user2.id,
      },
    });
    testCoupleId = couple.id;

    // Create emotional bank ledger
    await prisma.emotionalBankLedger.create({
      data: { coupleId: couple.id, balance: 0 },
    });

    // Generate auth token
    authToken = jwtService.sign({ sub: user1.id, email: user1.email });
  });

  afterAll(async () => {
    // Clean up in correct order (respect foreign key constraints)
    await prisma.analysisResult.deleteMany({
      where: { session: { coupleId: testCoupleId } },
    });
    await prisma.emotionalBankEntry.deleteMany({
      where: { ledger: { coupleId: testCoupleId } },
    });
    await prisma.session.deleteMany({
      where: { coupleId: testCoupleId },
    });
    await prisma.emotionalBankLedger.deleteMany({
      where: { coupleId: testCoupleId },
    });
    await prisma.couple.deleteMany({
      where: { id: testCoupleId },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'whatsapp-test' } },
    });
    await app.close();
  });

  describe('POST /sessions/import-whatsapp', () => {
    it('should import a valid WhatsApp chat', async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatContent: validChatContent,
          fileName: 'WhatsApp Chat with Sarah.txt',
        })
        .expect(201);

      expect(response.body.session).toBeDefined();
      expect(response.body.session.id).toBeDefined();
      expect(response.body.session.status).toBe('UPLOADED');
      expect(response.body.session.sourceType).toBe('WHATSAPP_CHAT');
      expect(response.body.participants).toContain('John');
      expect(response.body.participants).toContain('Sarah');
      expect(response.body.messageCount).toBe(6);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .send({ chatContent: validChatContent })
        .expect(401);
    });

    it('should reject empty chat content', async () => {
      await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: '' })
        .expect(400);
    });

    it('should reject chat content that is too short', async () => {
      await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: 'Too short' })
        .expect(400);
    });

    it('should reject invalid chat format', async () => {
      const invalidContent = `This is not a valid WhatsApp export.
It doesn't have the right format.
Just some random text here.`;

      // The parser will throw an error because it can't parse any messages
      await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: invalidContent })
        .expect(400);
    });

    it('should reject chat with only one participant', async () => {
      const singleParticipantChat = `[12/01/2024, 14:32:15] John: Hello
[12/01/2024, 14:33:02] John: Anyone there?
[12/01/2024, 14:34:18] John: I guess not...`;

      await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: singleParticipantChat })
        .expect(400);
    });

    it('should work without optional fileName', async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: validChatContent })
        .expect(201);

      expect(response.body.session).toBeDefined();
    });

    it('should detect date range from chat', async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: validChatContent })
        .expect(201);

      expect(response.body.dateRange).toBeDefined();
      expect(response.body.dateRange.start).toBeDefined();
      expect(response.body.dateRange.end).toBeDefined();
    });
  });

  describe('Session Analysis after Import', () => {
    it('should be able to analyze an imported session', async () => {
      // First import
      const importResponse = await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: validChatContent })
        .expect(201);

      const sessionId = importResponse.body.session.id;

      // Then analyze
      const analyzeResponse = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/analyze`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(analyzeResponse.body.overallScore).toBeDefined();
      expect(analyzeResponse.body.greenCardCount).toBeGreaterThanOrEqual(0);
    });

    it('should generate a report after analysis', async () => {
      // Import
      const importResponse = await request(app.getHttpServer())
        .post('/sessions/import-whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chatContent: validChatContent })
        .expect(201);

      const sessionId = importResponse.body.session.id;

      // Analyze
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/analyze`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Get report
      const reportResponse = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(reportResponse.body.session).toBeDefined();
      expect(reportResponse.body.analysis).toBeDefined();
      expect(reportResponse.body.emotionalBank).toBeDefined();
    });
  });
});
