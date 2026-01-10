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
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-new@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('test-e2e-new@example.com');
      expect(response.body.user.name).toBe('Test User');

      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { email: 'test-e2e-new@example.com' },
      });
      expect(user).toBeDefined();
      expect(user?.passwordHash).toBeDefined();
    });

    it('should register without name', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-noname@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('test-e2e-noname@example.com');
    });

    it('should reject duplicate email', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-dup@example.com',
          password: 'password123',
        })
        .expect(201);

      // Try to register with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-dup@example.com',
          password: 'password456',
        })
        .expect(409);
    });

    it('should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-short@example.com',
          password: '12345',
        })
        .expect(400);
    });

    it('should reject empty body', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e-login@example.com',
          password: 'password123',
          name: 'Login Test User',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-e2e-login@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('test-e2e-login@example.com');
      expect(response.body.user.name).toBe('Login Test User');
    });

    it('should reject wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-e2e-login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-e2e-nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should reject empty body', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });
});
