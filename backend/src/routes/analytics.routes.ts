import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validate';
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

// Dashboard overview
router.get('/overview', validateQuery(overviewQuerySchema), getOverview);

// Weekly breakdown
router.get('/weekly', validateQuery(periodQuerySchema), getWeeklyAnalytics);

// Monthly breakdown
router.get('/monthly', validateQuery(periodQuerySchema), getMonthlyAnalytics);

// Year heatmap
router.get('/heatmap', validateQuery(heatmapQuerySchema), getHeatmap);

// Habit-specific stats
router.get('/habits/:id', validateParams(habitIdParamSchema), getHabitStats);

// Streak leaderboard
router.get('/streaks', validateQuery(streaksQuerySchema), getStreaks);

// Insights and suggestions
router.get('/insights', getInsights);

// Calendar data (day-by-day with habit details)
router.get('/calendar', getCalendarData);

// Category breakdown and habit completion rates
router.get('/categories', getCategoryBreakdown);

// Week-over-week comparison
router.get('/comparison', getWeekComparison);

// Monthly trend (last 30 days)
router.get('/trend', getMonthlyTrend);

// Productivity score with breakdown
router.get('/productivity', getProductivityScore);

// Best performing days and habits
router.get('/performance', getBestPerforming);

// Habit correlations
router.get('/correlations', getCorrelations);

// Streak predictions and risk
router.get('/predictions', getPredictions);

export default router;
