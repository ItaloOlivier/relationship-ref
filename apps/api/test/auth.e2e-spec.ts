import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    await app.init();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.magicLink.deleteMany({
      where: { user: { email: { contains: 'test-e2e' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
  });

  afterAll(async () => {
    await prisma.magicLink.deleteMany({
      where: { user: { email: { contains: 'test-e2e' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
    await app.close();
  });

  describe('POST /auth/magic-link', () => {
    it('should create a magic link for new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'test-e2e-new@example.com' })
        .expect(201);

      expect(response.body.message).toContain('Magic link sent');

      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { email: 'test-e2e-new@example.com' },
      });
      expect(user).toBeDefined();
    });

    it('should create a magic link for existing user', async () => {
      // Create user first
      await prisma.user.create({
        data: { email: 'test-e2e-existing@example.com' },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'test-e2e-existing@example.com' })
        .expect(201);

      expect(response.body.message).toContain('Magic link sent');
    });

    it('should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'invalid-email' })
        .expect(400);
    });

    it('should reject empty email', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({})
        .expect(400);
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid magic link and return token', async () => {
      // Create user and magic link
      const user = await prisma.user.create({
        data: { email: 'test-e2e-verify@example.com' },
      });

      const magicLink = await prisma.magicLink.create({
        data: {
          token: 'valid-test-token-123',
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token: magicLink.token })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('test-e2e-verify@example.com');
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token: 'invalid-token' })
        .expect(401);
    });

    it('should reject expired token', async () => {
      const user = await prisma.user.create({
        data: { email: 'test-e2e-expired@example.com' },
      });

      await prisma.magicLink.create({
        data: {
          token: 'expired-test-token',
          userId: user.id,
          expiresAt: new Date(Date.now() - 1000), // Already expired
        },
      });

      await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token: 'expired-test-token' })
        .expect(401);
    });

    it('should reject already used token', async () => {
      const user = await prisma.user.create({
        data: { email: 'test-e2e-used@example.com' },
      });

      await prisma.magicLink.create({
        data: {
          token: 'used-test-token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          usedAt: new Date(), // Already used
        },
      });

      await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token: 'used-test-token' })
        .expect(401);
    });
  });
});
