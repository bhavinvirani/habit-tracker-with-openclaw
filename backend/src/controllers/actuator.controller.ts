import os from 'os';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { cacheMetrics } from '../utils/cache';
import { getRequestMetrics } from '../utils/requestMetrics';
import { isRedisConnected, getRedisClient } from '../config/redis';
import prisma from '../config/database';

// ============ HELPERS ============

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function toMB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function parseRedisInfo(infoString: string, keys: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of infoString.split('\r\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.substring(0, idx);
    if (keys.includes(key)) {
      result[key] = line.substring(idx + 1);
    }
  }
  return result;
}

// ============ HANDLER ============

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const uptimeSeconds = process.uptime();
  const mem = process.memoryUsage();

  // Sync stats
  const application = {
    name: 'habit-tracker-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      formatted: formatUptime(uptimeSeconds),
    },
    startedAt: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
  };

  const system = {
    memory: {
      rss: toMB(mem.rss),
      heapTotal: toMB(mem.heapTotal),
      heapUsed: toMB(mem.heapUsed),
      external: toMB(mem.external),
      arrayBuffers: toMB(mem.arrayBuffers),
    },
    cpu: process.cpuUsage(),
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    loadAverage: (() => {
      const [m1, m5, m15] = os.loadavg();
      return {
        '1m': Math.round(m1 * 100) / 100,
        '5m': Math.round(m5 * 100) / 100,
        '15m': Math.round(m15 * 100) / 100,
      };
    })(),
  };

  const total = cacheMetrics.hits + cacheMetrics.misses;
  const cache = {
    hits: cacheMetrics.hits,
    misses: cacheMetrics.misses,
    sets: cacheMetrics.sets,
    invalidations: cacheMetrics.invalidations,
    hitRate: total > 0 ? Math.round((cacheMetrics.hits / total) * 1000) / 10 : 0,
    backend: isRedisConnected() ? 'redis' : 'memory',
  };

  const requests = getRequestMetrics();

  // Async stats — use Promise.allSettled for resilience
  const [dbResult, redisResult] = await Promise.allSettled([getDatabaseStats(), getRedisStats()]);

  const database = dbResult.status === 'fulfilled' ? dbResult.value : { error: 'unavailable' };

  const redis =
    redisResult.status === 'fulfilled'
      ? redisResult.value
      : { connected: false, error: 'unavailable' };

  sendSuccess(res, {
    application,
    system,
    database,
    cache,
    requests,
    redis,
  });
});

// ============ DATABASE STATS ============

async function getDatabaseStats() {
  const [
    users,
    habitsTotal,
    habitsActive,
    habitsArchived,
    habitLogs,
    booksTotal,
    booksWantToRead,
    booksReading,
    booksFinished,
    booksAbandoned,
    challengesTotal,
    challengesActive,
    challengesCompleted,
    challengesFailed,
    challengesCancelled,
    connectedApps,
    reminders,
    refreshTokens,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.habit.count(),
    prisma.habit.count({ where: { isArchived: false } }),
    prisma.habit.count({ where: { isArchived: true } }),
    prisma.habitLog.count(),
    prisma.book.count(),
    prisma.book.count({ where: { status: 'WANT_TO_READ' } }),
    prisma.book.count({ where: { status: 'READING' } }),
    prisma.book.count({ where: { status: 'FINISHED' } }),
    prisma.book.count({ where: { status: 'ABANDONED' } }),
    prisma.challenge.count(),
    prisma.challenge.count({ where: { status: 'ACTIVE' } }),
    prisma.challenge.count({ where: { status: 'COMPLETED' } }),
    prisma.challenge.count({ where: { status: 'FAILED' } }),
    prisma.challenge.count({ where: { status: 'CANCELLED' } }),
    prisma.connectedApp.count({ where: { isActive: true } }),
    prisma.habitReminder.count({ where: { isActive: true } }),
    prisma.refreshToken.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  return {
    users,
    habits: { total: habitsTotal, active: habitsActive, archived: habitsArchived },
    habitLogs,
    books: {
      total: booksTotal,
      byStatus: {
        wantToRead: booksWantToRead,
        reading: booksReading,
        finished: booksFinished,
        abandoned: booksAbandoned,
      },
    },
    challenges: {
      total: challengesTotal,
      byStatus: {
        active: challengesActive,
        completed: challengesCompleted,
        failed: challengesFailed,
        cancelled: challengesCancelled,
      },
    },
    connectedApps,
    reminders,
    refreshTokens,
  };
}

// ============ REDIS STATS ============

const REDIS_SERVER_KEYS = ['redis_version', 'uptime_in_seconds', 'connected_clients', 'tcp_port'];

const REDIS_MEMORY_KEYS = [
  'used_memory_human',
  'used_memory_peak_human',
  'maxmemory_human',
  'mem_fragmentation_ratio',
];

async function getRedisStats() {
  const redis = getRedisClient();
  if (!redis) {
    return { connected: false };
  }

  const [serverInfo, memoryInfo] = await Promise.all([redis.info('server'), redis.info('memory')]);

  return {
    connected: true,
    server: parseRedisInfo(serverInfo, REDIS_SERVER_KEYS),
    memory: parseRedisInfo(memoryInfo, REDIS_MEMORY_KEYS),
  };
}
