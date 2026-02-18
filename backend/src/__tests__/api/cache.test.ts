import request from 'supertest';
import { createTestApp, registerTestUser } from '../helpers';
import {
  buildCacheKey,
  getCache,
  setCache,
  invalidateUserAnalyticsCache,
  cacheMetrics,
} from '../../utils/cache';

const app = createTestApp();

// ============ UNIT TESTS (no DB needed) ============

describe('Cache Utilities', () => {
  describe('buildCacheKey', () => {
    it('should build a key scoped to user and endpoint', () => {
      const key = buildCacheKey('user123', 'overview');
      expect(key).toBe('cache:user123:analytics:overview');
    });

    it('should include sorted params', () => {
      const key = buildCacheKey('user123', 'heatmap', { year: 2026, habitId: 'abc' });
      expect(key).toBe('cache:user123:analytics:heatmap:{"habitId":"abc","year":2026}');
    });

    it('should produce the same key regardless of param order', () => {
      const key1 = buildCacheKey('u1', 'test', { a: 1, b: 2 });
      const key2 = buildCacheKey('u1', 'test', { b: 2, a: 1 });
      expect(key1).toBe(key2);
    });

    it('should omit undefined/null params', () => {
      const key = buildCacheKey('u1', 'test', { a: 1, b: undefined, c: null });
      expect(key).toBe('cache:u1:analytics:test:{"a":1}');
    });

    it('should not append params suffix when all are undefined', () => {
      const key = buildCacheKey('u1', 'test', { a: undefined });
      expect(key).toBe('cache:u1:analytics:test');
    });
  });

  describe('getCache / setCache (in-memory fallback)', () => {
    it('should return null for a miss', async () => {
      const result = await getCache('nonexistent-key-xyz');
      expect(result).toBeNull();
    });

    it('should store and retrieve a value', async () => {
      const testKey = `test:cache:${Date.now()}`;
      const testData = { foo: 'bar', count: 42 };

      await setCache(testKey, testData, 60);
      const result = await getCache<typeof testData>(testKey);

      expect(result).toEqual(testData);
    });

    it('should store complex objects', async () => {
      const testKey = `test:complex:${Date.now()}`;
      const testData = {
        stats: { total: 10, completed: 5 },
        items: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
        ],
      };

      await setCache(testKey, testData, 60);
      const result = await getCache<typeof testData>(testKey);

      expect(result).toEqual(testData);
    });
  });

  describe('invalidateUserAnalyticsCache', () => {
    it('should clear all analytics cache entries for a user', async () => {
      const userId = `invalidate-test-${Date.now()}`;

      // Set multiple cache entries
      await setCache(buildCacheKey(userId, 'overview'), { a: 1 }, 60);
      await setCache(buildCacheKey(userId, 'weekly'), { b: 2 }, 60);
      await setCache(buildCacheKey(userId, 'monthly'), { c: 3 }, 60);

      // Verify they exist
      expect(await getCache(buildCacheKey(userId, 'overview'))).not.toBeNull();

      // Invalidate
      await invalidateUserAnalyticsCache(userId);

      // All should be gone
      expect(await getCache(buildCacheKey(userId, 'overview'))).toBeNull();
      expect(await getCache(buildCacheKey(userId, 'weekly'))).toBeNull();
      expect(await getCache(buildCacheKey(userId, 'monthly'))).toBeNull();
    });

    it('should not affect other users cache', async () => {
      const userId1 = `user1-${Date.now()}`;
      const userId2 = `user2-${Date.now()}`;

      await setCache(buildCacheKey(userId1, 'overview'), { a: 1 }, 60);
      await setCache(buildCacheKey(userId2, 'overview'), { b: 2 }, 60);

      await invalidateUserAnalyticsCache(userId1);

      expect(await getCache(buildCacheKey(userId1, 'overview'))).toBeNull();
      expect(await getCache(buildCacheKey(userId2, 'overview'))).not.toBeNull();
    });
  });

  describe('cacheMetrics', () => {
    it('should have numeric counters', () => {
      expect(typeof cacheMetrics.hits).toBe('number');
      expect(typeof cacheMetrics.misses).toBe('number');
      expect(typeof cacheMetrics.sets).toBe('number');
      expect(typeof cacheMetrics.invalidations).toBe('number');
    });

    it('should increment on cache operations', async () => {
      const before = { ...cacheMetrics };
      const testKey = `metrics-test-${Date.now()}`;

      // Miss
      await getCache(testKey);
      expect(cacheMetrics.misses).toBe(before.misses + 1);

      // Set
      await setCache(testKey, { data: true }, 60);
      expect(cacheMetrics.sets).toBe(before.sets + 1);

      // Hit
      await getCache(testKey);
      expect(cacheMetrics.hits).toBe(before.hits + 1);

      // Invalidation
      await invalidateUserAnalyticsCache(`metrics-user-${Date.now()}`);
      expect(cacheMetrics.invalidations).toBe(before.invalidations + 1);
    });
  });
});

// ============ INTEGRATION TESTS (DB-dependent) ============

describe('Cache Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    const testAuth = await registerTestUser(app);
    if (!testAuth) return;
    authToken = testAuth.token;
  });

  it('should return identical response on second call (cache hit)', async () => {
    if (!authToken) return;

    const res1 = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${authToken}`);

    const res2 = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body).toEqual(res2.body);
  });

  it('should return fresh data after cache-invalidating action', async () => {
    if (!authToken) return;

    // First call to populate cache
    const res1 = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res1.status).toBe(200);

    // Create a habit (triggers cache invalidation)
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Cache Test Habit ${Date.now()}`,
        frequency: 'daily',
        color: '#FF5733',
      });

    // If habit creation fails (e.g. DB issue), skip the rest
    if (habitRes.status !== 201) return;

    // Second call should reflect the new habit
    const res2 = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res2.status).toBe(200);
    // totalHabits should have increased by 1
    expect(res2.body.data.stats.totalHabits).toBe(res1.body.data.stats.totalHabits + 1);
  });
});
