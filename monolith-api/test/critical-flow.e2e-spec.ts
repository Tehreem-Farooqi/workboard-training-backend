import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Critical Flow E2E Test
 * 
 * Tests the complete event lifecycle from creation to approval:
 * 1. User signs up
 * 2. User creates a draft event
 * 3. User submits event for review
 * 4. Moderator reviews and approves event
 * 5. User views approved event
 * 6. Admin can view all events
 */
describe('Critical Flow: Event Lifecycle (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let moderatorToken: string;
  let adminToken: string;
  let eventId: string;
  let userId: string;
  let organizationId: string;

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

    // Get organization ID from existing user
    const existingUserResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@acme.com',
        password: 'Password123!',
      });
    organizationId = existingUserResponse.body.user.organizationId;

    // Login as moderator
    const moderatorResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'moderator@acme.com',
        password: 'Password123!',
      })
      .expect(201);
    moderatorToken = moderatorResponse.body.accessToken;

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

  describe('Step 1: User Signup', () => {
    it('should create a new user account', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: `testuser${timestamp}@example.com`,
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
          organizationId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(`testuser${timestamp}@example.com`);
      expect(response.body.user.role).toBe('USER');

      userToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should verify user can access /me endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body).toHaveProperty('organization');
    });
  });

  describe('Step 2: User Creates Draft Event', () => {
    it('should create a draft event', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Critical Flow Test Event',
          description: 'Testing the complete event lifecycle',
          location: 'Test Venue',
          startDate: '2026-06-15T14:00:00Z',
          endDate: '2026-06-15T18:00:00Z',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Critical Flow Test Event');
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.createdById).toBe(userId);

      eventId = response.body.id;
    });

    it('should allow user to view their draft event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(eventId);
      expect(response.body.status).toBe('DRAFT');
    });

    it('should allow user to update draft event', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Updated description for critical flow test',
        })
        .expect(200);

      expect(response.body.description).toBe(
        'Updated description for critical flow test',
      );
    });
  });

  describe('Step 3: User Submits Event for Review', () => {
    it('should submit draft event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${eventId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('SUBMITTED');
      expect(response.body.rejectionReason).toBeNull();
    });

    it('should not allow user to update submitted event', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Should not update',
        })
        .expect(403);
    });

    it('should not allow user to submit already submitted event', async () => {
      await request(app.getHttpServer())
        .post(`/events/${eventId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(409);
    });
  });

  describe('Step 4: Moderator Reviews and Approves Event', () => {
    it('should allow moderator to view submitted event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(response.body.id).toBe(eventId);
      expect(response.body.status).toBe('SUBMITTED');
    });

    it('should not allow regular user to approve event', async () => {
      await request(app.getHttpServer())
        .post(`/events/${eventId}/approve`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow moderator to approve event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${eventId}/approve`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(response.body.status).toBe('APPROVED');
      expect(response.body.rejectionReason).toBeNull();
    });

    it('should not allow approving already approved event', async () => {
      await request(app.getHttpServer())
        .post(`/events/${eventId}/approve`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(409);
    });
  });

  describe('Step 5: User Views Approved Event', () => {
    it('should allow user to view their approved event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(eventId);
      expect(response.body.status).toBe('APPROVED');
    });

    it('should show approved event in user event list', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const approvedEvent = response.body.data.find(
        (e: any) => e.id === eventId,
      );
      expect(approvedEvent).toBeDefined();
      expect(approvedEvent.status).toBe('APPROVED');
    });
  });

  describe('Step 6: Admin Can View All Events', () => {
    it('should allow admin to view all organization events', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const testEvent = response.body.data.find((e: any) => e.id === eventId);
      expect(testEvent).toBeDefined();
    });

    it('should allow admin to update any event', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          location: 'Admin Updated Location',
        })
        .expect(200);

      expect(response.body.location).toBe('Admin Updated Location');
    });
  });

  describe('Alternative Flow: Event Rejection', () => {
    let rejectedEventId: string;

    it('should create and submit another event', async () => {
      // Create event
      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Event to be Rejected',
          description: 'This event will be rejected',
          location: 'Test Location',
          startDate: '2026-07-01T10:00:00Z',
          endDate: '2026-07-01T12:00:00Z',
        })
        .expect(201);

      rejectedEventId = createResponse.body.id;

      // Submit event
      await request(app.getHttpServer())
        .post(`/events/${rejectedEventId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should allow moderator to reject event with reason', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${rejectedEventId}/reject`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          reason: 'Event does not meet quality standards and lacks detail',
        })
        .expect(200);

      expect(response.body.status).toBe('REJECTED');
      expect(response.body.rejectionReason).toBe(
        'Event does not meet quality standards and lacks detail',
      );
    });

    it('should allow user to view rejection reason', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${rejectedEventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('REJECTED');
      expect(response.body.rejectionReason).toContain('quality standards');
    });
  });

  describe('Pagination and Filtering', () => {
    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 5);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?status=APPROVED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((event: any) => {
        expect(event.status).toBe('APPROVED');
      });
    });

    it('should support search', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?search=Critical Flow')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const foundEvent = response.body.data.find((e: any) => e.id === eventId);
      expect(foundEvent).toBeDefined();
    });
  });

  describe('Security and Authorization', () => {
    it('should not allow access without token', async () => {
      await request(app.getHttpServer()).get('/events').expect(401);
    });

    it('should not allow user to view events from other organizations', async () => {
      // This would require creating a user in a different org
      // For now, we verify org scoping is enforced
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // All events should belong to the same organization
      response.body.data.forEach((event: any) => {
        expect(event.organizationId).toBe(organizationId);
      });
    });

    it('should not allow user to delete non-draft events', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should not allow moderator to delete events', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);
    });
  });
});
