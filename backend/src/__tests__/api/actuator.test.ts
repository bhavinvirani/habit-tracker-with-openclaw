import request from 'supertest';
import { createTestApp } from '../helpers';

const app = createTestApp();

describe('Actuator Stats', () => {
  test('GET /actuator/stats returns 200 with all 13 stat categories', async () => {
    const res = await request(app).get('/actuator/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data).toHaveProperty('application');
    expect(data).toHaveProperty('system');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('cache');
    expect(data).toHaveProperty('requests');
    expect(data).toHaveProperty('redis');
    expect(data).toHaveProperty('deployment');
    expect(data).toHaveProperty('errors');
    expect(data).toHaveProperty('cronJobs');
    expect(data).toHaveProperty('rateLimiting');
    expect(data).toHaveProperty('activeUsers');
    expect(data).toHaveProperty('dependencies');
    expect(data).toHaveProperty('prismaMetrics');
  });

  test('application info has expected fields', async () => {
    const res = await request(app).get('/actuator/stats');
    const { application } = res.body.data;

    expect(application).toHaveProperty('name', 'habit-tracker-backend');
    expect(application).toHaveProperty('version');
    expect(application).toHaveProperty('environment');
    expect(application).toHaveProperty('nodeVersion');
    expect(application).toHaveProperty('uptime');
    expect(application.uptime).toHaveProperty('seconds');
    expect(application.uptime).toHaveProperty('formatted');
    expect(application).toHaveProperty('startedAt');
  });

  test('system metrics include memory and CPU', async () => {
    const res = await request(app).get('/actuator/stats');
    const { system } = res.body.data;

    expect(system).toHaveProperty('memory');
    expect(system.memory).toHaveProperty('rss');
    expect(system.memory).toHaveProperty('heapTotal');
    expect(system.memory).toHaveProperty('heapUsed');
    expect(system).toHaveProperty('cpu');
    expect(system.cpu).toHaveProperty('user');
    expect(system.cpu).toHaveProperty('system');
    expect(system).toHaveProperty('platform');
    expect(system).toHaveProperty('loadAverage');
  });

  test('request metrics track the actuator request itself', async () => {
    const res = await request(app).get('/actuator/stats');
    const { requests } = res.body.data;

    expect(requests.totalRequests).toBeGreaterThan(0);
    expect(requests).toHaveProperty('byMethod');
    expect(requests).toHaveProperty('byStatusGroup');
    expect(requests).toHaveProperty('averageResponseTime');
    expect(requests).toHaveProperty('startedAt');
  });

  test('cache stats include hitRate and backend type', async () => {
    const res = await request(app).get('/actuator/stats');
    const { cache } = res.body.data;

    expect(cache).toHaveProperty('hits');
    expect(cache).toHaveProperty('misses');
    expect(cache).toHaveProperty('sets');
    expect(cache).toHaveProperty('invalidations');
    expect(cache).toHaveProperty('hitRate');
    expect(cache).toHaveProperty('backend');
    expect(['redis', 'memory']).toContain(cache.backend);
  });

  test('database degrades gracefully when unavailable', async () => {
    // Even if the database queries fail, the endpoint should still return 200
    // with an error object in the database field
    const res = await request(app).get('/actuator/stats');
    expect(res.status).toBe(200);
    // Either valid DB data or an error object — both are acceptable
    expect(res.body.data).toHaveProperty('database');
  });

  test('does not require authentication', async () => {
    const res = await request(app).get('/actuator/stats');
    expect(res.status).not.toBe(401);
  });

  test('deployment info has packageVersion field', async () => {
    const res = await request(app).get('/actuator/stats');
    const { deployment } = res.body.data;

    expect(deployment).toHaveProperty('packageVersion');
    expect(deployment).toHaveProperty('gitSha');
    expect(deployment).toHaveProperty('buildTimestamp');
    expect(deployment).toHaveProperty('dockerImage');
  });

  test('errors has totalErrors and byCode', async () => {
    const res = await request(app).get('/actuator/stats');
    const { errors } = res.body.data;

    expect(errors).toHaveProperty('totalErrors');
    expect(typeof errors.totalErrors).toBe('number');
    expect(errors).toHaveProperty('byCode');
    expect(errors).toHaveProperty('recent');
    expect(Array.isArray(errors.recent)).toBe(true);
  });

  test('cronJobs is an object', async () => {
    const res = await request(app).get('/actuator/stats');
    const { cronJobs } = res.body.data;

    expect(typeof cronJobs).toBe('object');
    expect(cronJobs).not.toBeNull();
  });

  test('rateLimiting has totalThrottled', async () => {
    const res = await request(app).get('/actuator/stats');
    const { rateLimiting } = res.body.data;

    expect(rateLimiting).toHaveProperty('totalThrottled');
    expect(typeof rateLimiting.totalThrottled).toBe('number');
    expect(rateLimiting).toHaveProperty('byLimiter');
  });

  test('activeUsers has dau/wau/mau fields or degrades gracefully', async () => {
    const res = await request(app).get('/actuator/stats');
    const { activeUsers } = res.body.data;

    // Either has DAU/WAU/MAU or error field when DB unavailable
    if (activeUsers.error) {
      expect(activeUsers.error).toBe('unavailable');
    } else {
      expect(activeUsers).toHaveProperty('dau');
      expect(activeUsers).toHaveProperty('wau');
      expect(activeUsers).toHaveProperty('mau');
      expect(activeUsers).toHaveProperty('totalRegistered');
    }
  });

  test('dependencies has database and redis fields or degrades gracefully', async () => {
    const res = await request(app).get('/actuator/stats');
    const { dependencies } = res.body.data;

    // Either has health pings or error field
    if (dependencies.error) {
      expect(dependencies.error).toBe('unavailable');
    } else {
      expect(dependencies).toHaveProperty('database');
      expect(dependencies).toHaveProperty('redis');
      expect(dependencies.database).toHaveProperty('status');
      expect(dependencies.database).toHaveProperty('latencyMs');
    }
  });
});
