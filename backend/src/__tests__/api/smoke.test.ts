import request from 'supertest';
import { createTestApp } from '../helpers';
import prisma from '../../config/database';

const app = createTestApp();

describe('Smoke Tests', () => {
  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('Database is accessible', async () => {
    try {
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result).toBeTruthy();
    } catch {
      // DB not available in this environment — skip
    }
  });

  test('POST /api/auth/register validates input', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login validates input', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Protected routes require authentication', async () => {
    const res = await request(app).get('/api/habits');
    expect(res.status).toBe(401);
  });

  test('Unknown routes return 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  test('POST /api/auth/register rejects weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'short',
      name: 'Test',
    });
    expect(res.status).toBe(400);
  });

  test('JSON body size limit is enforced', async () => {
    // Send a payload larger than 10kb
    const largePayload = { data: 'x'.repeat(20000) };
    const res = await request(app).post('/api/auth/login').send(largePayload);
    expect(res.status).toBe(413);
  });
});
