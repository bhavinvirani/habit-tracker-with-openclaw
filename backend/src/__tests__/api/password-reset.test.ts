import crypto from 'crypto';
import request from 'supertest';
import { createTestApp, uniqueEmail } from '../helpers';
import prisma from '../../config/database';

const app = createTestApp();

describe('Password Reset API', () => {
  const testEmail = uniqueEmail();
  const testPassword = 'TestPass123!';
  const testName = 'Reset User';
  let userId: string;

  // Register a user for testing
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: testPassword,
      name: testName,
    });

    // Skip all tests if DB is not available
    if (res.status === 500) return;
    userId = res.body.data?.user?.id;
  });

  afterAll(async () => {
    await prisma.passwordReset
      .deleteMany({ where: { email: { startsWith: 'test-' } } })
      .catch(() => {});
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-' } } }).catch(() => {});
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 200 for existing email', async () => {
      if (!userId) return;
      const res = await request(app).post('/api/auth/forgot-password').send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account');
    });

    it('should return 200 for non-existent email (anti-enumeration)', async () => {
      if (!userId) return;
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should invalidate previous tokens when requesting a new one', async () => {
      if (!userId) return;

      // Request first reset
      await request(app).post('/api/auth/forgot-password').send({ email: testEmail });

      const firstTokens = await prisma.passwordReset.findMany({
        where: { email: testEmail, usedAt: null },
      });
      expect(firstTokens.length).toBe(1);

      // Request second reset
      await request(app).post('/api/auth/forgot-password').send({ email: testEmail });

      // Old tokens should be marked as used
      const unusedTokens = await prisma.passwordReset.findMany({
        where: { email: testEmail, usedAt: null },
      });
      expect(unusedTokens.length).toBe(1);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token and allow login with new password', async () => {
      if (!userId) return;

      // Create a token directly for testing
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.passwordReset.create({
        data: {
          tokenHash,
          email: testEmail,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const newPassword = 'NewPass456!';
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawToken, password: newPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset successfully');

      // Login with new password should succeed
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: newPassword });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it('should reject invalid token', async () => {
      if (!userId) return;
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalidtoken123', password: 'NewPass789!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject expired token', async () => {
      if (!userId) return;

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.passwordReset.create({
        data: {
          tokenHash,
          email: testEmail,
          expiresAt: new Date(Date.now() - 1000), // Already expired
        },
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawToken, password: 'NewPass789!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject already-used token', async () => {
      if (!userId) return;

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.passwordReset.create({
        data: {
          tokenHash,
          email: testEmail,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          usedAt: new Date(), // Already used
        },
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawToken, password: 'NewPass789!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should revoke all refresh tokens after reset', async () => {
      if (!userId) return;

      // Login to create a refresh token
      await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'NewPass456!' });

      const tokensBefore = await prisma.refreshToken.findMany({ where: { userId } });
      expect(tokensBefore.length).toBeGreaterThan(0);

      // Reset password
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.passwordReset.create({
        data: {
          tokenHash,
          email: testEmail,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawToken, password: 'AnotherPass999!' });

      const tokensAfter = await prisma.refreshToken.findMany({ where: { userId } });
      expect(tokensAfter.length).toBe(0);
    });

    it('should reject missing token field', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'NewPass789!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'sometoken', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
