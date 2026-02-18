import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { buildCacheKey, getCache, setCache } from '../utils/cache';

/**
 * Middleware factory that caches successful JSON responses.
 * Only caches when req.userId is available (post-auth).
 */
export function cacheResponse(endpointName: string, ttlSeconds: number) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return next();
    }

    const cacheKey = buildCacheKey(req.userId, endpointName, req.query as Record<string, unknown>);

    // Check cache
    const cached = await getCache<unknown>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, ttlSeconds).catch(() => {
          // Swallow cache write errors — already logged in setCache
        });
      }
      return originalJson(body);
    }) as Response['json'];

    next();
  };
}
