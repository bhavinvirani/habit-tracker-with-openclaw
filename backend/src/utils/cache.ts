import { getRedisClient } from '../config/redis';
import prisma from '../config/database';
import logger from './logger';

// ============ TTL CONSTANTS (seconds) ============

export const CACHE_TTL = {
  OVERVIEW: 5 * 60, // 5 min
  WEEKLY: 5 * 60,
  MONTHLY: 10 * 60,
  HEATMAP: 15 * 60,
  STREAKS: 5 * 60,
  INSIGHTS: 10 * 60,
  CALENDAR: 10 * 60,
  CATEGORIES: 10 * 60,
  COMPARISON: 5 * 60,
  TREND: 10 * 60,
  PRODUCTIVITY: 5 * 60,
  PERFORMANCE: 10 * 60,
  CORRELATIONS: 30 * 60, // 30 min (expensive)
  PREDICTIONS: 15 * 60,
} as const;

// ============ IN-MEMORY FALLBACK ============

interface MemoryCacheEntry {
  data: string;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

// Periodically clean expired entries from memory cache
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of memoryCache) {
      if (entry.expiresAt <= now) {
        memoryCache.delete(key);
      }
    }
  },
  5 * 60 * 1000
); // Every 5 minutes

// ============ CACHE METRICS ============

export const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  invalidations: 0,
};

// ============ CACHE FUNCTIONS ============

/**
 * Build a deterministic cache key scoped to user and endpoint.
 * Sorts query params for consistency.
 */
export function buildCacheKey(
  userId: string,
  endpoint: string,
  params?: Record<string, unknown>
): string {
  let key = `cache:${userId}:analytics:${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const sorted = Object.keys(params)
      .sort()
      .reduce(
        (acc, k) => {
          if (params[k] !== undefined && params[k] !== null) {
            acc[k] = params[k];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
    if (Object.keys(sorted).length > 0) {
      key += `:${JSON.stringify(sorted)}`;
    }
  }
  return key;
}

/**
 * Get a cached value. Tries Redis first, falls back to in-memory.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    if (redis) {
      const data = await redis.get(key);
      if (data) {
        cacheMetrics.hits++;
        logger.debug('Cache hit (Redis)', { key });
        return JSON.parse(data) as T;
      }
      cacheMetrics.misses++;
      return null;
    }

    // In-memory fallback
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      cacheMetrics.hits++;
      logger.debug('Cache hit (memory)', { key });
      return JSON.parse(entry.data) as T;
    }
    if (entry) {
      memoryCache.delete(key);
    }
    cacheMetrics.misses++;
    return null;
  } catch (err) {
    logger.warn('Cache get error', { key, error: (err as Error).message });
    return null;
  }
}

/**
 * Set a cached value with TTL. Writes to Redis if available, otherwise in-memory.
 */
export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    cacheMetrics.sets++;
    const serialized = JSON.stringify(data);
    const redis = getRedisClient();
    if (redis) {
      await redis.setex(key, ttlSeconds, serialized);
      logger.debug('Cache set (Redis)', { key, ttl: ttlSeconds });
      return;
    }

    // In-memory fallback
    memoryCache.set(key, {
      data: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    logger.debug('Cache set (memory)', { key, ttl: ttlSeconds });
  } catch (err) {
    logger.warn('Cache set error', { key, error: (err as Error).message });
  }
}

/**
 * Invalidate all analytics cache entries for a user.
 * Uses SCAN (not KEYS) to avoid blocking Redis.
 */
export async function invalidateUserAnalyticsCache(userId: string): Promise<void> {
  const pattern = `cache:${userId}:analytics:*`;
  cacheMetrics.invalidations++;

  try {
    const redis = getRedisClient();
    if (redis) {
      let cursor = '0';
      let totalDeleted = 0;
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        logger.debug('Cache invalidated (Redis)', { userId, count: totalDeleted });
      }
      return;
    }

    // In-memory fallback
    let deleted = 0;
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`cache:${userId}:analytics:`)) {
        memoryCache.delete(key);
        deleted++;
      }
    }
    if (deleted > 0) {
      logger.debug('Cache invalidated (memory)', { userId, count: deleted });
    }
  } catch (err) {
    logger.warn('Cache invalidation error', { userId, error: (err as Error).message });
  }
}

// ============ CACHE WARMING ============

/**
 * Pre-warm analytics cache for recently active users.
 * Runs after server startup to eliminate cold-start latency.
 */
export async function warmAnalyticsCache(): Promise<void> {
  try {
    // Find users with refresh tokens created in last 7 days (recently active)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await prisma.refreshToken.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ['userId'],
      take: 50,
    });

    if (recentUsers.length === 0) {
      logger.info('Cache warming: no recent users found');
      return;
    }

    // Lazy import to avoid circular dependency
    const analyticsService = await import('../services/analytics.service');

    let warmed = 0;
    for (const { userId } of recentUsers) {
      try {
        const data = await analyticsService.getOverview(userId, {});
        const key = buildCacheKey(userId, 'overview');
        await setCache(
          key,
          { success: true, data, meta: { timestamp: new Date().toISOString() } },
          CACHE_TTL.OVERVIEW
        );
        warmed++;
      } catch {
        // Skip individual user failures
      }
    }

    logger.info(`Cache warmed for ${warmed} users`);
  } catch (err) {
    logger.warn('Cache warming failed', { error: (err as Error).message });
  }
}
