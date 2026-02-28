import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let userEventId: string;
  let adminEventId: string;

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

    // Login as regular user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@acme.com',
        password: 'Password123!',
      })
      .expect(201);
    userToken = userResponse.body.accessToken;

    // Login as admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@acme.com',
        password: 'Password123!',
      })
      .expect(201);
    adminToken = adminResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /events', () => {
    it('should create event as user', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'User Test Event',
          description: 'This is a test event created by user',
          location: 'Test Location',
          startDate: '2026-05-01T10:00:00Z',
          endDate: '2026-05-01T16:00:00Z',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('User Test Event');
      expect(response.body.status).toBe('DRAFT');
      userEventId = response.body.id;
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'Unauthorized Event',
          description: 'This should fail',
          startDate: '2026-05-01T10:00:00Z',
          endDate: '2026-05-01T16:00:00Z',
        })
        .expect(401);
    });

    it('should fail with invalid dates', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Invalid Event',
          description: 'End date before start date',
          startDate: '2026-05-01T16:00:00Z',
          endDate: '2026-05-01T10:00:00Z',
        })
        .expect(400);
    });
  });

  describe('GET /events', () => {
    it('should get all events for user (only own events)', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // User should only see their own events
      response.body.forEach((event: any) => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('title');
      });
    });

    it('should get all events for admin (all org events)', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/events').expect(401);
    });
  });

  describe('GET /events/:id', () => {
    it('should get own event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${userEventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(userEventId);
      expect(response.body.title).toBe('User Test Event');
    });

    it('should return 404 for non-existent event', () => {
      return request(app.getHttpServer())
        .get('/events/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PATCH /events/:id', () => {
    it('should update own event', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/events/${userEventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated User Test Event',
          location: 'Updated Location',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated User Test Event');
      expect(response.body.location).toBe('Updated Location');
    });

    it('should fail to update non-existent event', () => {
      return request(app.getHttpServer())
        .patch('/events/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Should Fail',
        })
        .expect(404);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should delete own event', () => {
      return request(app.getHttpServer())
        .delete(`/events/${userEventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should return 404 for already deleted event', () => {
      return request(app.getHttpServer())
        .delete(`/events/${userEventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete('/events/00000000-0000-0000-0000-000000000001')
        .expect(401);
    });
  });
});
