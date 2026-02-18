import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis | null = null;
let connected = false;

/**
 * Get or create the Redis client singleton.
 * Returns null if REDIS_URL is not set or in test environment.
 */
export function getRedisClient(): Redis | null {
  if (process.env.NODE_ENV === 'test') return null;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (redisClient) return connected ? redisClient : null;

  redisClient = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: null, // required by rate-limit-redis
    retryStrategy(times) {
      if (times > 10) {
        logger.warn('Redis max reconnect attempts reached, giving up');
        return null; // stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  redisClient.on('connect', () => {
    connected = true;
    logger.info('Redis connected successfully');
  });

  redisClient.on('ready', () => {
    connected = true;
  });

  redisClient.on('error', (err) => {
    connected = false;
    logger.warn('Redis connection error', { error: err.message });
  });

  redisClient.on('close', () => {
    connected = false;
  });

  // Attempt connection (non-blocking)
  redisClient.connect().catch((err) => {
    logger.warn('Redis initial connection failed, running without cache', {
      error: err.message,
    });
  });

  return connected ? redisClient : null;
}

/**
 * Check if Redis is currently connected
 */
export function isRedisConnected(): boolean {
  return connected;
}

/**
 * Gracefully disconnect Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected');
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
    connected = false;
  }
}

/**
 * Get the raw Redis client (for rate-limit-redis which needs the instance directly).
 * Unlike getRedisClient(), this returns the client even when not yet connected,
 * since rate-limit-redis manages its own connection state.
 */
export function getRedisClientForStore(): Redis | null {
  if (process.env.NODE_ENV === 'test') return null;
  if (!process.env.REDIS_URL) return null;

  // Ensure client is initialized
  if (!redisClient) {
    getRedisClient();
  }

  return redisClient;
}
