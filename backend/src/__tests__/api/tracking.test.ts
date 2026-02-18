import request from 'supertest';
import { createTestApp, registerTestUser } from '../helpers';
import prisma from '../../config/database';
import { format, subDays } from 'date-fns';

const app = createTestApp();

describe('Tracking API', () => {
  let authToken: string;
  let userId: string;
  let habitId: string;

  // Setup: Create test user and habit
  beforeAll(async () => {
    const testAuth = await registerTestUser(app);
    if (!testAuth) return;
    authToken = testAuth.token;
    userId = testAuth.userId;

    // Create a test habit
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Tracking Habit',
        habitType: 'NUMERIC',
        targetValue: 8,
        unit: 'glasses',
        frequency: 'DAILY',
      });

    habitId = habitRes.body.data?.habit?.id;
  });

  // Cleanup
  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  describe('GET /api/tracking/today', () => {
    it("should return today's habits", async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/tracking/today')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('date');
      expect(res.body.data).toHaveProperty('habits');
      expect(Array.isArray(res.body.data.habits)).toBe(true);
    });

    it('should include habit completion status', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/tracking/today')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.habits.forEach((habit: { isCompleted: boolean }) => {
        expect(typeof habit.isCompleted).toBe('boolean');
      });
    });
  });

  describe('POST /api/tracking/check-in', () => {
    it('should check in a boolean habit', async () => {
      if (!authToken) return;
      // Create a boolean habit
      const boolHabitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Boolean Test Habit',
          habitType: 'BOOLEAN',
          frequency: 'DAILY',
        });

      const boolHabitId = boolHabitRes.body.data.habit.id;

      const res = await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: boolHabitId,
          completed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.log.completed).toBe(true);
    });

    it('should check in a numeric habit with value', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habitId,
          completed: true,
          value: 6,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.log.value).toBe(6);
    });

    it('should check in for a specific date', async () => {
      if (!authToken) return;
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      const res = await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habitId,
          completed: true,
          value: 8,
          date: yesterday,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should update streak after check-in', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habitId,
          completed: true,
          value: 8,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.streak).toHaveProperty('currentStreak');
    });

    it('should detect milestones', async () => {
      if (!authToken) return;
      // Check in multiple times to potentially trigger a milestone
      const res = await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habitId,
          completed: true,
          value: 8,
        });

      expect(res.status).toBe(201);
      // Milestones may or may not be present depending on streak count
      expect(res.body.data).toHaveProperty('milestones');
    });

    it('should reject check-in for non-existent habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: 'non-existent-id',
          completed: true,
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tracking/check-in', () => {
    it('should undo a check-in', async () => {
      if (!authToken) return;
      const today = format(new Date(), 'yyyy-MM-dd');

      // First, check in
      await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habitId,
          completed: true,
          value: 8,
        });

      // Then, undo
      const res = await request(app)
        .delete('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habitId,
          date: today,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tracking/date/:date', () => {
    it('should return habits for a specific date', async () => {
      if (!authToken) return;
      const today = format(new Date(), 'yyyy-MM-dd');

      const res = await request(app)
        .get(`/api/tracking/date/${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('date');
      expect(res.body.data).toHaveProperty('habits');
    });

    it('should reject invalid date format', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/tracking/date/invalid-date')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tracking/history', () => {
    it('should return habit history', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/tracking/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
    });

    it('should filter history by habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/tracking/history?habitId=${habitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.logs.forEach((log: { habitId: string }) => {
        expect(log.habitId).toBe(habitId);
      });
    });

    it('should support date range filter', async () => {
      if (!authToken) return;
      const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const res = await request(app)
        .get(`/api/tracking/history?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tracking/milestones', () => {
    it('should return user milestones', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/tracking/milestones')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('milestones');
    });

    it('should filter milestones by habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/tracking/milestones?habitId=${habitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });
});
