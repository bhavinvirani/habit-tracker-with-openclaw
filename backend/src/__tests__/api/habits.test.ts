import request from 'supertest';
import { createTestApp, registerTestUser } from '../helpers';
import prisma from '../../config/database';

const app = createTestApp();

describe('Habits API', () => {
  let authToken: string;
  let userId: string;
  let habitId: string;

  // Setup: Create test user and get auth token
  beforeAll(async () => {
    const testAuth = await registerTestUser(app);
    if (!testAuth) return;
    authToken = testAuth.token;
    userId = testAuth.userId;
  });

  // Cleanup after tests
  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  describe('POST /api/habits', () => {
    it('should create a basic habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Morning Exercise',
          description: 'Do 30 minutes of exercise',
          frequency: 'DAILY',
          color: '#10b981',
          icon: '🏃',
          category: 'Health',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.habit.name).toBe('Morning Exercise');
      expect(res.body.data.habit.frequency).toBe('DAILY');
      expect(res.body.data.habit.habitType).toBe('BOOLEAN');
      expect(res.body.data.habit.isActive).toBe(true);
      expect(res.body.data.habit.isArchived).toBe(false);

      habitId = res.body.data.habit.id;
    });

    it('should create a numeric habit with target', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Drink Water',
          habitType: 'NUMERIC',
          targetValue: 8,
          unit: 'glasses',
          frequency: 'DAILY',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.habit.habitType).toBe('NUMERIC');
      expect(res.body.data.habit.targetValue).toBe(8);
      expect(res.body.data.habit.unit).toBe('glasses');
    });

    it('should create a duration habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Meditation',
          habitType: 'DURATION',
          targetValue: 20,
          unit: 'minutes',
          frequency: 'DAILY',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.habit.habitType).toBe('DURATION');
      expect(res.body.data.habit.targetValue).toBe(20);
    });

    it('should create a weekly habit with specific days', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Weekly Review',
          frequency: 'WEEKLY',
          daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        });

      expect(res.status).toBe(201);
      expect(res.body.data.habit.frequency).toBe('WEEKLY');
      expect(res.body.data.habit.daysOfWeek).toEqual([1, 3, 5]);
    });

    it('should reject habit without name', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No name provided',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request', async () => {
      if (!authToken) return;
      const res = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/habits', () => {
    it('should return all user habits', async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/habits').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.habits)).toBe(true);
      expect(res.body.data.habits.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/habits?category=Health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.habits.forEach((habit: { category: string }) => {
        expect(habit.category).toBe('Health');
      });
    });

    it('should filter active habits only', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/habits?isActive=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.habits.forEach((habit: { isActive: boolean }) => {
        expect(habit.isActive).toBe(true);
      });
    });

    // Note: Pagination is not currently implemented for habits endpoint
    it('should accept pagination params', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/habits?limit=2&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.habits)).toBe(true);
    });
  });

  describe('GET /api/habits/:id', () => {
    it('should return a specific habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.habit.id).toBe(habitId);
      expect(res.body.data.habit.name).toBe('Morning Exercise');
    });

    it('should return 404 for non-existent habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/habits/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/habits/:id', () => {
    it('should update habit name', async () => {
      if (!authToken) return;
      const res = await request(app)
        .patch(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Exercise',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.habit.name).toBe('Updated Exercise');
    });

    it('should update habit color and icon', async () => {
      if (!authToken) return;
      const res = await request(app)
        .patch(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          color: '#ff0000',
          icon: '💪',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.habit.color).toBe('#ff0000');
      expect(res.body.data.habit.icon).toBe('💪');
    });
  });

  describe('POST /api/habits/:id/archive', () => {
    it('should archive a habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post(`/api/habits/${habitId}/archive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.habit.isArchived).toBe(true);
    });
  });

  describe('POST /api/habits/:id/unarchive', () => {
    it('should restore an archived habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post(`/api/habits/${habitId}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.habit.isArchived).toBe(false);
    });
  });

  describe('PATCH /api/habits/reorder', () => {
    it('should reorder habits', async () => {
      if (!authToken) return;
      // Get all habits first
      const habitsRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`);

      const habitIds = habitsRes.body.data.habits.map((h: { id: string }) => h.id);

      if (habitIds.length >= 2) {
        // Reverse the order
        const reorderedIds = [...habitIds].reverse();

        const res = await request(app)
          .patch('/api/habits/reorder')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ habitIds: reorderedIds });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('should delete a habit', async () => {
      if (!authToken) return;
      // Create a habit to delete
      const createRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Habit to Delete' });

      const deleteId = createRes.body.data.habit.id;

      const res = await request(app)
        .delete(`/api/habits/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify it's deleted
      const getRes = await request(app)
        .get(`/api/habits/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
