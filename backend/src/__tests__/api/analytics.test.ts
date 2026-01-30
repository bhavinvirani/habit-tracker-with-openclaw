import request from 'supertest';
import { createTestApp } from '../helpers';

const app = createTestApp();

describe('Analytics API', () => {
  let authToken: string;
  let habitId: string;

  // Setup: Get auth token (use existing test user with data)
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    authToken = res.body.data?.token;

    // Get a habit ID for testing
    if (authToken) {
      const habitsRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`);

      if (habitsRes.body.data?.habits?.length > 0) {
        habitId = habitsRes.body.data.habits[0].id;
      }
    }
  });

  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toHaveProperty('totalHabits');
      expect(res.body.data.stats).toHaveProperty('activeHabits');
      expect(res.body.data.stats).toHaveProperty('completedToday');
      expect(res.body.data.stats).toHaveProperty('todayPercentage');
      expect(res.body.data.stats).toHaveProperty('currentBestStreak');
      expect(res.body.data.stats).toHaveProperty('totalCompletions');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/analytics/overview');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/analytics/weekly', () => {
    it('should return weekly analytics', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/weekly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('days');
      expect(Array.isArray(res.body.data.days)).toBe(true);
    });

    it('should support custom week start date', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/weekly?startDate=2026-01-20')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/monthly', () => {
    it('should return monthly analytics', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/monthly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('weeks');
      expect(res.body.data).toHaveProperty('summary');
    });

    it('should support custom month/year', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/monthly?month=1&year=2026')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/heatmap', () => {
    it('should return heatmap data', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/heatmap')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('heatmap');
      expect(Array.isArray(res.body.data.heatmap)).toBe(true);
    });

    it('should support year filter', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/heatmap?year=2026')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.heatmap.forEach((day: { date: string; count: number; level: number }) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('count');
        expect(day).toHaveProperty('level');
        expect(day.level).toBeGreaterThanOrEqual(0);
        expect(day.level).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('GET /api/analytics/habits/:id', () => {
    it('should return habit-specific stats', async () => {
      if (!authToken || !habitId) return;

      const res = await request(app)
        .get(`/api/analytics/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('habit');
      expect(res.body.data).toHaveProperty('currentStreak');
      expect(res.body.data).toHaveProperty('longestStreak');
      expect(res.body.data).toHaveProperty('totalCompletions');
      expect(res.body.data).toHaveProperty('completionRate');
      expect(res.body.data).toHaveProperty('recentLogs');
      expect(res.body.data).toHaveProperty('weeklyTrend');
    });

    it('should return 404 for non-existent habit', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/habits/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/analytics/streaks', () => {
    it('should return streak leaderboard', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/streaks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('streaks');
      expect(Array.isArray(res.body.data.streaks)).toBe(true);

      if (res.body.data.streaks.length > 0) {
        const streak = res.body.data.streaks[0];
        expect(streak).toHaveProperty('habitId');
        expect(streak).toHaveProperty('habitName');
        expect(streak).toHaveProperty('currentStreak');
        expect(streak).toHaveProperty('longestStreak');
      }
    });
  });

  describe('GET /api/analytics/insights', () => {
    it('should return insights', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/analytics/insights')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('bestDay');
      expect(res.body.data).toHaveProperty('worstDay');
      expect(res.body.data).toHaveProperty('topHabit');
      expect(res.body.data).toHaveProperty('suggestions');
    });
  });
});
