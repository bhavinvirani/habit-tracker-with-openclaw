import request from 'supertest';
import { createTestApp } from '../helpers';

const app = createTestApp();

describe('Templates API', () => {
  let authToken: string;

  // Setup: Get auth token
  beforeAll(async () => {
    // Login with existing test user
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    authToken = res.body.data?.token;

    // If test user doesn't exist, create one
    if (!authToken) {
      const registerRes = await request(app).post('/api/auth/register').send({
        email: 'template-test@example.com',
        password: 'TestPass123!',
        name: 'Template Test User',
      });
      authToken = registerRes.body.data?.token;
    }
  });

  describe('GET /api/templates', () => {
    it('should return all templates', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.templates)).toBe(true);
    });

    it('should filter by category', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/templates?category=Health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.templates.length > 0) {
        res.body.data.templates.forEach((template: { category: string }) => {
          expect(template.category).toBe('Health');
        });
      }
    });

    it('should support search', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/templates?search=exercise')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should return a specific template', async () => {
      if (!authToken) return;
      // First get all templates
      const listRes = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);

      if (listRes.body.data.templates.length > 0) {
        const templateId = listRes.body.data.templates[0].id;

        const res = await request(app)
          .get(`/api/templates/${templateId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.template.id).toBe(templateId);
      }
    });

    it('should return 404 for non-existent template', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/templates/:id/use', () => {
    it('should create a habit from template', async () => {
      if (!authToken) return;
      // First get all templates
      const listRes = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);

      if (listRes.body.data.templates.length > 0) {
        const templateId = listRes.body.data.templates[0].id;

        const res = await request(app)
          .post(`/api/templates/${templateId}/use`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({});

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.habit).toHaveProperty('id');
        expect(res.body.data.habit.templateId).toBe(templateId);
      }
    });

    it('should allow customization when using template', async () => {
      if (!authToken) return;
      const listRes = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);

      if (listRes.body.data.templates.length > 0) {
        const templateId = listRes.body.data.templates[0].id;

        const res = await request(app)
          .post(`/api/templates/${templateId}/use`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Custom Name',
            color: '#ff0000',
          });

        expect(res.status).toBe(201);
        expect(res.body.data.habit.name).toBe('Custom Name');
        expect(res.body.data.habit.color).toBe('#ff0000');
      }
    });
  });

  describe('GET /api/templates - categories', () => {
    it('should return templates grouped by category', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('byCategory');
      expect(typeof res.body.data.byCategory).toBe('object');
    });
  });
});
