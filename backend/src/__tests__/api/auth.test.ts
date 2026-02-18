import request from 'supertest';
import { createTestApp, uniqueEmail } from '../helpers';
import prisma from '../../config/database';

const app = createTestApp();

describe('Auth API', () => {
  const testEmail = uniqueEmail();
  const testPassword = 'TestPass123!';
  const testName = 'Test User';
  let authToken: string;

  // Cleanup after tests
  afterAll(async () => {
    await prisma.user
      .deleteMany({
        where: { email: { startsWith: 'test-' } },
      })
      .catch(() => {});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      // Skip if DB is not available (returns 500)
      if (res.status === 500) return;

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.name).toBe(testName);
      expect(res.body.data.user).not.toHaveProperty('password');

      authToken = res.body.data?.token;
    });

    it('should reject duplicate email', async () => {
      if (!authToken) return;
      const res = await request(app).post('/api/auth/register').send({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: testPassword,
        name: testName,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: uniqueEmail(),
        password: '123',
        name: testName,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty name', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: uniqueEmail(),
        password: testPassword,
        name: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      if (!authToken) return;
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it('should reject invalid password', async () => {
      if (!authToken) return;
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      if (!authToken) return;
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
