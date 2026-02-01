import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';
import * as trackingService from '../services/tracking.service';
import {
  CheckInInput,
  UndoCheckInInput,
  HistoryQuery,
  DateParam,
} from '../validators/tracking.validator';

/**
 * GET /tracking/today
 * Get today's habits with completion status
 */
export const getTodayHabits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await trackingService.getTodayHabits(req.userId!);

  sendSuccess(
    res,
    {
      date: result.date,
      habits: result.habits,
      summary: {
        total: result.habits.length,
        completed: result.habits.filter((h) => h.isCompleted).length,
        remaining: result.habits.filter((h) => !h.isCompleted).length,
      },
    },
    "Today's habits retrieved successfully"
  );
});

/**
 * POST /tracking/check-in
 * Log habit completion
 */
export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body as CheckInInput;
  const result = await trackingService.checkIn(req.userId!, data);

  const message =
    result.milestones.length > 0
      ? `Habit logged! 🎉 You achieved ${result.milestones.length} milestone(s)!`
      : result.streak.currentStreak > 1
        ? `Habit logged! 🔥 ${result.streak.currentStreak} day streak!`
        : 'Habit logged successfully!';

  sendCreated(
    res,
    {
      log: result.log,
      streak: result.streak,
      milestones: result.milestones,
    },
    message
  );
});

/**
 * DELETE /tracking/check-in
 * Undo a check-in
 */
export const undoCheckIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body as UndoCheckInInput;
  await trackingService.undoCheckIn(req.userId!, data);

  sendSuccess(res, null, 'Check-in undone successfully');
});

/**
 * GET /tracking/date/:date
 * Get habits for a specific date
 */
export const getHabitsByDate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.params as unknown as DateParam;
  const habits = await trackingService.getHabitsByDate(req.userId!, date);

  sendSuccess(
    res,
    {
      date,
      habits,
      summary: {
        total: habits.length,
        completed: habits.filter((h) => h.isCompleted).length,
        remaining: habits.filter((h) => !h.isCompleted).length,
      },
    },
    'Habits retrieved successfully'
  );
});

/**
 * GET /tracking/history
 * Get tracking history for calendar/heatmap
 */
export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as HistoryQuery;
  const result = await trackingService.getHistory(req.userId!, query);

  sendSuccess(
    res,
    {
      entries: result.entries,
      logs: result.logs,
      summary: {
        totalDays: result.entries.length,
        daysWithActivity: result.entries.filter((e) => e.count > 0).length,
        perfectDays: result.entries.filter((e) => e.percentage === 100).length,
        averageCompletion: Math.round(
          result.entries.reduce((sum, e) => sum + e.percentage, 0) / result.entries.length
        ),
      },
    },
    'History retrieved successfully'
  );
});

/**
 * GET /tracking/milestones
 * Get all milestones for a user
 */
export const getMilestones = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { habitId } = req.query as { habitId?: string };
  const milestones = await trackingService.getMilestones(req.userId!, habitId);

  sendSuccess(res, { milestones }, 'Milestones retrieved successfully');
});
