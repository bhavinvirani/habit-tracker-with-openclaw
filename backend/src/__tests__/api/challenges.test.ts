import request from 'supertest';
import { createTestApp, registerTestUser } from '../helpers';
import prisma from '../../config/database';
import { format } from 'date-fns';

const app = createTestApp();

describe('Challenges API', () => {
  let authToken: string;
  let userId: string;
  let challengeId: string;
  let habitId1: string;
  let habitId2: string;

  // Setup: Create test user and habits
  beforeAll(async () => {
    const testAuth = await registerTestUser(app);
    if (!testAuth) return;
    authToken = testAuth.token;
    userId = testAuth.userId;

    // Create test habits for challenges
    const habit1Res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Challenge Habit 1', frequency: 'DAILY' });
    habitId1 = habit1Res.body.data?.habit?.id;

    const habit2Res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Challenge Habit 2', frequency: 'DAILY' });
    habitId2 = habit2Res.body.data?.habit?.id;
  });

  // Cleanup
  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  describe('POST /api/challenges', () => {
    it('should create a new challenge', async () => {
      if (!authToken) return;
      const today = format(new Date(), 'yyyy-MM-dd');

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '30 Day Fitness Challenge',
          description: 'Complete fitness habits for 30 days',
          duration: 30,
          startDate: today,
          habitIds: [habitId1, habitId2],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('30 Day Fitness Challenge');
      expect(res.body.data.duration).toBe(30);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.habits).toHaveLength(2);

      challengeId = res.body.data.id;
    });

    it('should reject challenge without habits', async () => {
      if (!authToken) return;
      const today = format(new Date(), 'yyyy-MM-dd');

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Empty Challenge',
          duration: 30,
          startDate: today,
          habitIds: [],
        });

      expect(res.status).toBe(400);
    });

    it('should reject challenge without name', async () => {
      if (!authToken) return;
      const today = format(new Date(), 'yyyy-MM-dd');

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration: 30,
          startDate: today,
          habitIds: [habitId1],
        });

      expect(res.status).toBe(400);
    });

    it('should reject duration over 365 days', async () => {
      if (!authToken) return;
      const today = format(new Date(), 'yyyy-MM-dd');

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Too Long Challenge',
          duration: 400,
          startDate: today,
          habitIds: [habitId1],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/challenges', () => {
    it('should return all challenges', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.challenges)).toBe(true);
      expect(res.body.data.challenges.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/challenges?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.challenges.forEach((challenge: { status: string }) => {
        expect(challenge.status).toBe('ACTIVE');
      });
    });

    it('should include progress information', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const challenge = res.body.data.challenges[0];
      expect(challenge).toHaveProperty('daysElapsed');
      expect(challenge).toHaveProperty('daysRemaining');
      expect(challenge).toHaveProperty('progressPercentage');
    });
  });

  describe('GET /api/challenges/:id', () => {
    it('should return a specific challenge', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/challenges/${challengeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(challengeId);
      expect(res.body.data.name).toBe('30 Day Fitness Challenge');
      expect(res.body.data).toHaveProperty('habits');
      expect(res.body.data).toHaveProperty('progress');
    });

    it('should return 404 for non-existent challenge', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/challenges/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/challenges/:id', () => {
    it('should update challenge name', async () => {
      if (!authToken) return;
      const res = await request(app)
        .put(`/api/challenges/${challengeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Fitness Challenge',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Fitness Challenge');
    });

    it('should update challenge description', async () => {
      if (!authToken) return;
      const res = await request(app)
        .put(`/api/challenges/${challengeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated description');
    });
  });

  describe('POST /api/challenges/:id/sync', () => {
    it('should sync challenge progress', async () => {
      if (!authToken) return;
      // First, check in the habits
      await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId: habitId1, completed: true });

      await request(app)
        .post('/api/tracking/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId: habitId2, completed: true });

      // Then sync the challenge
      const res = await request(app)
        .post(`/api/challenges/${challengeId}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('habitsCompleted');
      expect(res.body.data).toHaveProperty('habitsTotal');
    });

    it('should sync for a specific date', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post(`/api/challenges/${challengeId}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: format(new Date(), 'yyyy-MM-dd'),
        });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/challenges/:id/progress', () => {
    it('should return detailed challenge progress', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/challenges/${challengeId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('challenge');
      expect(res.body.data).toHaveProperty('habits');
      expect(res.body.data).toHaveProperty('dailyBreakdown');
      expect(res.body.data).toHaveProperty('summary');
    });

    it('should include summary statistics', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/challenges/${challengeId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const summary = res.body.data.summary;
      expect(summary).toHaveProperty('daysCompleted');
      expect(summary).toHaveProperty('perfectDays');
      expect(summary).toHaveProperty('currentStreak');
      expect(summary).toHaveProperty('overallCompletion');
    });
  });

  describe('DELETE /api/challenges/:id', () => {
    it('should delete a challenge', async () => {
      if (!authToken) return;
      // Create a challenge to delete
      const today = format(new Date(), 'yyyy-MM-dd');
      const createRes = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Challenge to Delete',
          duration: 7,
          startDate: today,
          habitIds: [habitId1],
        });

      const deleteId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/challenges/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/challenges/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
