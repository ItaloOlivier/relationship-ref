import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('CouplesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const createTestUser = async (email: string) => {
    const user = await prisma.user.create({
      data: { email, name: email.split('@')[0] },
    });
    const token = jwtService.sign({ sub: user.id, email: user.email });
    return { user, token };
  };

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
  });

  beforeEach(async () => {
    // Clean up in correct order
    await prisma.emotionalBankEntry.deleteMany({});
    await prisma.emotionalBankLedger.deleteMany({});
    await prisma.couple.deleteMany({
      where: {
        OR: [
          { partner1: { email: { contains: 'couple-test' } } },
          { partner2: { email: { contains: 'couple-test' } } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'couple-test' } },
    });
  });

  afterAll(async () => {
    await prisma.emotionalBankEntry.deleteMany({});
    await prisma.emotionalBankLedger.deleteMany({});
    await prisma.couple.deleteMany({
      where: {
        OR: [
          { partner1: { email: { contains: 'couple-test' } } },
          { partner2: { email: { contains: 'couple-test' } } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'couple-test' } },
    });
    await app.close();
  });

  describe('POST /couples', () => {
    it('should create a new couple with invite code', async () => {
      const { token } = await createTestUser('couple-test-create@example.com');

      const response = await request(app.getHttpServer())
        .post('/couples')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Couple' })
        .expect(201);

      expect(response.body.inviteCode).toBeDefined();
      expect(response.body.inviteCode).toHaveLength(8);
      expect(response.body.name).toBe('Test Couple');
    });

    it('should reject if user already in a couple', async () => {
      const { user, token } = await createTestUser('couple-test-duplicate@example.com');

      // Create first couple
      await prisma.couple.create({
        data: {
          partner1Id: user.id,
          inviteCode: 'TEST1234',
        },
      });

      // Try to create another
      await request(app.getHttpServer())
        .post('/couples')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(409);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .post('/couples')
        .send({})
        .expect(401);
    });
  });

  describe('POST /couples/join', () => {
    it('should allow joining with valid invite code', async () => {
      const { user: partner1 } = await createTestUser('couple-test-p1@example.com');
      const { token: partner2Token } = await createTestUser('couple-test-p2@example.com');

      // Create couple with partner1
      const couple = await prisma.couple.create({
        data: {
          partner1Id: partner1.id,
          inviteCode: 'JOIN1234',
        },
      });

      // Partner2 joins
      const response = await request(app.getHttpServer())
        .post('/couples/join')
        .set('Authorization', `Bearer ${partner2Token}`)
        .send({ inviteCode: 'JOIN1234' })
        .expect(200);

      expect(response.body.partner2).toBeDefined();
    });

    it('should reject invalid invite code', async () => {
      const { token } = await createTestUser('couple-test-invalid@example.com');

      await request(app.getHttpServer())
        .post('/couples/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ inviteCode: 'INVALID1' })
        .expect(404);
    });

    it('should reject if couple already full', async () => {
      const { user: partner1 } = await createTestUser('couple-test-full1@example.com');
      const { user: partner2 } = await createTestUser('couple-test-full2@example.com');
      const { token: partner3Token } = await createTestUser('couple-test-full3@example.com');

      await prisma.couple.create({
        data: {
          partner1Id: partner1.id,
          partner2Id: partner2.id,
          inviteCode: 'FULL1234',
        },
      });

      await request(app.getHttpServer())
        .post('/couples/join')
        .set('Authorization', `Bearer ${partner3Token}`)
        .send({ inviteCode: 'FULL1234' })
        .expect(400);
    });
  });

  describe('GET /couples/me', () => {
    it('should return couple info', async () => {
      const { user, token } = await createTestUser('couple-test-me@example.com');

      await prisma.couple.create({
        data: {
          partner1Id: user.id,
          inviteCode: 'MEEE1234',
          name: 'My Couple',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/couples/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.name).toBe('My Couple');
      expect(response.body.inviteCode).toBe('MEEE1234');
    });

    it('should return null if not in couple', async () => {
      const { token } = await createTestUser('couple-test-none@example.com');

      const response = await request(app.getHttpServer())
        .get('/couples/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('DELETE /couples/leave', () => {
    it('should allow leaving couple as partner2', async () => {
      const { user: partner1 } = await createTestUser('couple-test-leave1@example.com');
      const { user: partner2, token: partner2Token } = await createTestUser('couple-test-leave2@example.com');

      await prisma.couple.create({
        data: {
          partner1Id: partner1.id,
          partner2Id: partner2.id,
          inviteCode: 'LEAVE123',
        },
      });

      const response = await request(app.getHttpServer())
        .delete('/couples/leave')
        .set('Authorization', `Bearer ${partner2Token}`)
        .expect(200);

      expect(response.body.message).toContain('Left');

      // Verify partner2 is removed
      const couple = await prisma.couple.findFirst({
        where: { inviteCode: 'LEAVE123' },
      });
      expect(couple?.partner2Id).toBeNull();
    });
  });
});
