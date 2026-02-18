import request from 'supertest';
import { createTestApp, registerTestUser } from '../helpers';
import prisma from '../../config/database';

const app = createTestApp();

describe('Bot & Integration API', () => {
  let authToken: string;
  let userId: string;
  let apiKey: string;
  let habitId: string;
  let numericHabitId: string;

  // Setup: register user, generate API key, create habits
  beforeAll(async () => {
    const testAuth = await registerTestUser(app);
    if (!testAuth) return;
    authToken = testAuth.token;
    userId = testAuth.userId;

    // Generate API key
    const keyRes = await request(app)
      .post('/api/users/api-key')
      .set('Authorization', `Bearer ${authToken}`);
    apiKey = keyRes.body.data?.apiKey;

    // Create a boolean habit
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Morning Run', frequency: 'DAILY', color: '#10b981' });
    habitId = habitRes.body.data?.habit?.id;

    // Create a numeric habit
    const numericRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Drink Water',
        habitType: 'NUMERIC',
        targetValue: 8,
        unit: 'glasses',
        frequency: 'DAILY',
      });
    numericHabitId = numericRes.body.data?.habit?.id;
  });

  // Cleanup
  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  // ============ API KEY AUTH ============

  describe('API Key Authentication', () => {
    it('should reject requests without API key', async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/bot/habits/today');
      expect(res.status).toBe(401);
    });

    it('should reject requests with invalid API key', async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/bot/habits/today').set('X-API-Key', 'invalid-key');
      expect(res.status).toBe(401);
    });

    it('should accept requests with valid API key', async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/bot/habits/today').set('X-API-Key', apiKey);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============ BOT HABITS ============

  describe('GET /api/bot/habits/today', () => {
    it("should return today's habits in bot-friendly format", async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/bot/habits/today').set('X-API-Key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('habits');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('total');
      expect(res.body.data.summary).toHaveProperty('completed');
      expect(res.body.data.summary).toHaveProperty('remaining');

      const habit = res.body.data.habits.find((h: { id: string }) => h.id === numericHabitId);
      expect(habit).toBeDefined();
      expect(habit.name).toBe('Drink Water');
      expect(habit.type).toBe('NUMERIC');
      expect(habit.target).toBe(8);
      expect(habit.unit).toBe('glasses');
    });
  });

  describe('POST /api/bot/habits/check-in', () => {
    it('should check in a boolean habit', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/habits/check-in')
        .set('X-API-Key', apiKey)
        .send({ habitId, completed: true });

      expect(res.status).toBe(200);
      expect(res.body.data.habit).toBe('Morning Run');
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data).toHaveProperty('streak');
      expect(res.body.data).toHaveProperty('message');
    });

    it('should check in a numeric habit with value', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/habits/check-in')
        .set('X-API-Key', apiKey)
        .send({ habitId: numericHabitId, completed: false, value: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.habit).toBe('Drink Water');
      expect(res.body.data.status).toContain('3');
    });

    it('should reject invalid habitId', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/habits/check-in')
        .set('X-API-Key', apiKey)
        .send({ habitId: 'not-a-uuid', completed: true });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/bot/habits/check-in-by-name', () => {
    it('should find and check in a habit by name', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/habits/check-in-by-name')
        .set('X-API-Key', apiKey)
        .send({ name: 'water', value: 5, completed: true });

      expect(res.status).toBe(200);
      // Should match "Drink Water"
      expect(res.body.data.habit).toBe('Drink Water');
    });

    it('should return 404 for non-matching name', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/habits/check-in-by-name')
        .set('X-API-Key', apiKey)
        .send({ name: 'xyznonexistent', completed: true });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/bot/habits/summary', () => {
    it('should return daily summary', async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/bot/habits/summary').set('X-API-Key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('total');
      expect(res.body.data.summary).toHaveProperty('percentage');
      expect(res.body.data).toHaveProperty('completedHabits');
      expect(res.body.data).toHaveProperty('remainingHabits');
    });
  });

  // ============ REGISTER CHAT ============

  describe('POST /api/bot/register-chat', () => {
    it('should register a telegram chat', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/register-chat')
        .set('X-API-Key', apiKey)
        .send({ provider: 'telegram', chatId: '123456789', username: 'testbot' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('provider', 'telegram');
      expect(res.body.data).toHaveProperty('chatId', '123456789');
    });

    it('should update existing chat registration', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/register-chat')
        .set('X-API-Key', apiKey)
        .send({ provider: 'telegram', chatId: '987654321', username: 'newbot' });

      expect(res.status).toBe(201);
      expect(res.body.data.chatId).toBe('987654321');
    });

    it('should reject missing provider', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/bot/register-chat')
        .set('X-API-Key', apiKey)
        .send({ chatId: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ============ INTEGRATIONS (JWT auth) ============

  describe('GET /api/integrations', () => {
    it('should list connected apps', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/integrations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.apps).toBeInstanceOf(Array);
      expect(res.body.data.apps.length).toBeGreaterThan(0);
      expect(res.body.data.apps[0]).toHaveProperty('provider', 'telegram');
    });

    it('should require authentication', async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/integrations');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/integrations/:provider', () => {
    it('should disconnect a provider', async () => {
      if (!authToken) return;
      const res = await request(app)
        .delete('/api/integrations/telegram')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);

      // Verify it's gone
      const listRes = await request(app)
        .get('/api/integrations')
        .set('Authorization', `Bearer ${authToken}`);
      expect(listRes.body.data.apps.length).toBe(0);
    });

    it('should return 404 for non-existent provider', async () => {
      if (!authToken) return;
      const res = await request(app)
        .delete('/api/integrations/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ============ REMINDERS ============

  describe('Reminders CRUD', () => {
    it('should create a reminder', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId, time: '20:00' });

      expect(res.status).toBe(201);
      expect(res.body.data.reminder).toHaveProperty('time', '20:00');
      expect(res.body.data.reminder.habit.name).toBe('Morning Run');
    });

    it('should list reminders', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reminders).toBeInstanceOf(Array);
      expect(res.body.data.reminders.length).toBe(1);
    });

    it('should update an existing reminder time', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId, time: '21:30' });

      expect(res.status).toBe(201);
      expect(res.body.data.reminder.time).toBe('21:30');
    });

    it('should delete a reminder', async () => {
      if (!authToken) return;
      const res = await request(app)
        .delete(`/api/reminders/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);

      // Verify it's gone
      const listRes = await request(app)
        .get('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`);
      expect(listRes.body.data.reminders.length).toBe(0);
    });

    it('should reject invalid time format', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId, time: '25:99' });

      expect(res.status).toBe(400);
    });
  });

  describe('Notification Settings', () => {
    it('should get default settings', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/reminders/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.settings.dailySummaryEnabled).toBe(false);
      expect(res.body.data.settings.reminderEnabled).toBe(true);
    });

    it('should update settings', async () => {
      if (!authToken) return;
      const res = await request(app)
        .put('/api/reminders/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dailySummaryEnabled: true, dailySummaryTime: '21:00' });

      expect(res.status).toBe(200);
      expect(res.body.data.settings.dailySummaryEnabled).toBe(true);
      expect(res.body.data.settings.dailySummaryTime).toBe('21:00');
    });

    it('should persist settings', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/reminders/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.settings.dailySummaryEnabled).toBe(true);
      expect(res.body.data.settings.dailySummaryTime).toBe('21:00');
    });
  });
});
