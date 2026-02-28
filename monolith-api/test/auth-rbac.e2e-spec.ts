import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let moderatorToken: string;
  let userToken: string;

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

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Login as admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@acme.com',
        password: 'Password123!',
      })
      .expect(201);
    adminToken = adminResponse.body.accessToken;

    // Login as moderator
    const moderatorResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'moderator@acme.com',
        password: 'Password123!',
      })
      .expect(201);
    moderatorToken = moderatorResponse.body.accessToken;

    // Login as regular user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@acme.com',
        password: 'Password123!',
      })
      .expect(201);
    userToken = userResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth/admin-only', () => {
    it('should return 401 when no token provided', () => {
      return request(app.getHttpServer())
        .get('/auth/admin-only')
        .expect(401);
    });

    it('should return 401 when invalid token provided', () => {
      return request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 403 when user role is USER', () => {
      return request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Access denied');
        });
    });

    it('should return 403 when user role is MODERATOR', () => {
      return request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Access denied');
        });
    });

    it('should return 200 when user role is ADMIN', () => {
      return request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Welcome, admin!');
          expect(res.body.user.role).toBe('ADMIN');
        });
    });
  });

  describe('GET /auth/moderator-only', () => {
    it('should return 401 when no token provided', () => {
      return request(app.getHttpServer())
        .get('/auth/moderator-only')
        .expect(401);
    });

    it('should return 403 when user role is USER', () => {
      return request(app.getHttpServer())
        .get('/auth/moderator-only')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Access denied');
        });
    });

    it('should return 200 when user role is MODERATOR', () => {
      return request(app.getHttpServer())
        .get('/auth/moderator-only')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Welcome, moderator or admin!');
          expect(res.body.user.role).toBe('MODERATOR');
        });
    });

    it('should return 200 when user role is ADMIN', () => {
      return request(app.getHttpServer())
        .get('/auth/moderator-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Welcome, moderator or admin!');
          expect(res.body.user.role).toBe('ADMIN');
        });
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 when no token provided', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should return 200 for any authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
    });
  });
});
