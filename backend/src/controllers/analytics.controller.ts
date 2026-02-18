import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as analyticsService from '../services/analytics.service';
import {
  OverviewQuery,
  PeriodQuery,
  HeatmapQuery,
  HabitIdParam,
  StreaksQuery,
  PaginatedQuery,
} from '../validators/analytics.validator';

/**
 * GET /analytics/overview
 * Get dashboard overview stats
 */
export const getOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as OverviewQuery;
  const result = await analyticsService.getOverview(req.userId!, query);

  sendSuccess(
    res,
    {
      stats: result.stats,
      weeklyProgress: result.weeklyProgress,
    },
    'Analytics overview retrieved successfully'
  );
});

/**
 * GET /analytics/weekly
 * Get weekly breakdown
 */
export const getWeeklyAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as PeriodQuery;
  const result = await analyticsService.getWeeklyAnalytics(req.userId!, query);

  sendSuccess(res, result, 'Weekly analytics retrieved successfully');
});

/**
 * GET /analytics/monthly
 * Get monthly breakdown
 */
export const getMonthlyAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as PeriodQuery;
  const result = await analyticsService.getMonthlyAnalytics(req.userId!, query);

  sendSuccess(res, result, 'Monthly analytics retrieved successfully');
});

/**
 * GET /analytics/heatmap
 * Get year heatmap data
 */
export const getHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as HeatmapQuery;
  const heatmap = await analyticsService.getHeatmap(req.userId!, query);

  sendSuccess(res, { heatmap }, 'Heatmap data retrieved successfully');
});

/**
 * GET /analytics/habits/:id
 * Get stats for a specific habit
 */
export const getHabitStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params as unknown as HabitIdParam;
  const stats = await analyticsService.getHabitStats(req.userId!, id);

  sendSuccess(res, stats, 'Habit stats retrieved successfully');
});

/**
 * GET /analytics/streaks
 * Get streak leaderboard
 */
export const getStreaks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as StreaksQuery;
  const result = await analyticsService.getStreakLeaderboard(req.userId!, query);

  sendSuccess(
    res,
    {
      streaks: result.streaks,
      total: result.total,
      limit: query.limit || 10,
      offset: query.offset || 0,
    },
    'Streak leaderboard retrieved successfully'
  );
});

/**
 * GET /analytics/insights
 * Get insights and suggestions
 */
export const getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const insights = await analyticsService.getInsights(req.userId!);

  sendSuccess(res, insights, 'Insights retrieved successfully');
});

/**
 * GET /analytics/calendar
 * Get calendar data with day-by-day breakdown
 */
export const getCalendarData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

  const result = await analyticsService.getCalendarData(req.userId!, year, month);

  sendSuccess(res, result, 'Calendar data retrieved successfully');
});

/**
 * GET /analytics/categories
 * Get category breakdown and habit completion rates
 */
export const getCategoryBreakdown = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await analyticsService.getCategoryBreakdown(req.userId!);

  sendSuccess(res, result, 'Category breakdown retrieved successfully');
});

/**
 * GET /analytics/comparison
 * Get week-over-week comparison
 */
export const getWeekComparison = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await analyticsService.getWeekComparison(req.userId!);

  sendSuccess(res, result, 'Week comparison retrieved successfully');
});

/**
 * GET /analytics/trend
 * Get monthly trend data
 */
export const getMonthlyTrend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await analyticsService.getMonthlyTrend(req.userId!);

  sendSuccess(res, result, 'Monthly trend retrieved successfully');
});

/**
 * GET /analytics/productivity
 * Get productivity score with breakdown
 */
export const getProductivityScore = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await analyticsService.getProductivityScore(req.userId!);

  sendSuccess(res, result, 'Productivity score retrieved successfully');
});

/**
 * GET /analytics/performance
 * Get best performing days and habits analysis
 */
export const getBestPerforming = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await analyticsService.getBestPerformingAnalysis(req.userId!);

  sendSuccess(res, result, 'Performance analysis retrieved successfully');
});

/**
 * GET /analytics/correlations
 * Get habit correlations
 */
export const getCorrelations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as PaginatedQuery;
  const result = await analyticsService.getHabitCorrelations(req.userId!, query);

  sendSuccess(
    res,
    {
      correlations: result.correlations,
      total: result.total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    },
    'Habit correlations retrieved successfully'
  );
});

/**
 * GET /analytics/predictions
 * Get streak predictions and risk assessment
 */
export const getPredictions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as PaginatedQuery;
  const result = await analyticsService.getStreakPredictions(req.userId!, query);

  sendSuccess(
    res,
    {
      predictions: result.predictions,
      total: result.total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    },
    'Streak predictions retrieved successfully'
  );
});
