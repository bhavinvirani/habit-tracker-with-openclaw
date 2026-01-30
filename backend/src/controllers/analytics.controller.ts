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
  const streaks = await analyticsService.getStreakLeaderboard(req.userId!, query);

  sendSuccess(res, { streaks }, 'Streak leaderboard retrieved successfully');
});

/**
 * GET /analytics/insights
 * Get insights and suggestions
 */
export const getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const insights = await analyticsService.getInsights(req.userId!);

  sendSuccess(res, insights, 'Insights retrieved successfully');
});
