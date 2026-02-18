import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validate';
import { analyticsLimiter } from '../middleware/rateLimiter';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { CACHE_TTL } from '../utils/cache';
import {
  overviewQuerySchema,
  periodQuerySchema,
  heatmapQuerySchema,
  habitIdParamSchema,
  streaksQuerySchema,
  paginatedQuerySchema,
} from '../validators/analytics.validator';
import {
  getOverview,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getHeatmap,
  getHabitStats,
  getStreaks,
  getInsights,
  getCalendarData,
  getCategoryBreakdown,
  getWeekComparison,
  getMonthlyTrend,
  getProductivityScore,
  getBestPerforming,
  getCorrelations,
  getPredictions,
} from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);
router.use(analyticsLimiter);

router.get(
  '/overview',
  validateQuery(overviewQuerySchema),
  cacheResponse('overview', CACHE_TTL.OVERVIEW),
  getOverview
);

router.get(
  '/weekly',
  validateQuery(periodQuerySchema),
  cacheResponse('weekly', CACHE_TTL.WEEKLY),
  getWeeklyAnalytics
);

router.get(
  '/monthly',
  validateQuery(periodQuerySchema),
  cacheResponse('monthly', CACHE_TTL.MONTHLY),
  getMonthlyAnalytics
);

router.get(
  '/heatmap',
  validateQuery(heatmapQuerySchema),
  cacheResponse('heatmap', CACHE_TTL.HEATMAP),
  getHeatmap
);

// Skip caching for individual habit stats (changes frequently with check-ins)
router.get('/habits/:id', validateParams(habitIdParamSchema), getHabitStats);

router.get(
  '/streaks',
  validateQuery(streaksQuerySchema),
  cacheResponse('streaks', CACHE_TTL.STREAKS),
  getStreaks
);

router.get('/insights', cacheResponse('insights', CACHE_TTL.INSIGHTS), getInsights);

router.get('/calendar', cacheResponse('calendar', CACHE_TTL.CALENDAR), getCalendarData);

router.get('/categories', cacheResponse('categories', CACHE_TTL.CATEGORIES), getCategoryBreakdown);

router.get('/comparison', cacheResponse('comparison', CACHE_TTL.COMPARISON), getWeekComparison);

router.get('/trend', cacheResponse('trend', CACHE_TTL.TREND), getMonthlyTrend);

router.get(
  '/productivity',
  cacheResponse('productivity', CACHE_TTL.PRODUCTIVITY),
  getProductivityScore
);

router.get('/performance', cacheResponse('performance', CACHE_TTL.PERFORMANCE), getBestPerforming);

router.get(
  '/correlations',
  validateQuery(paginatedQuerySchema),
  cacheResponse('correlations', CACHE_TTL.CORRELATIONS),
  getCorrelations
);

router.get(
  '/predictions',
  validateQuery(paginatedQuerySchema),
  cacheResponse('predictions', CACHE_TTL.PREDICTIONS),
  getPredictions
);

export default router;
