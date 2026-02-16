import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validate';
import { analyticsLimiter } from '../middleware/rateLimiter';
import {
  overviewQuerySchema,
  periodQuerySchema,
  heatmapQuerySchema,
  habitIdParamSchema,
  streaksQuerySchema,
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

router.get('/overview', validateQuery(overviewQuerySchema), getOverview);

router.get('/weekly', validateQuery(periodQuerySchema), getWeeklyAnalytics);

router.get('/monthly', validateQuery(periodQuerySchema), getMonthlyAnalytics);

router.get('/heatmap', validateQuery(heatmapQuerySchema), getHeatmap);

router.get('/habits/:id', validateParams(habitIdParamSchema), getHabitStats);

router.get('/streaks', validateQuery(streaksQuerySchema), getStreaks);

router.get('/insights', getInsights);

router.get('/calendar', getCalendarData);

router.get('/categories', getCategoryBreakdown);

router.get('/comparison', getWeekComparison);

router.get('/trend', getMonthlyTrend);

router.get('/productivity', getProductivityScore);

router.get('/performance', getBestPerforming);

router.get('/correlations', getCorrelations);

router.get('/predictions', getPredictions);

export default router;
