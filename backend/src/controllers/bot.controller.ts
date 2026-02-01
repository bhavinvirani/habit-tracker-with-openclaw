import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';
import * as botService from '../services/bot.service';

/**
 * GET /api/bot/habits/today
 * Get today's habits in a bot-friendly format
 */
export const getTodayHabits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await botService.getTodayHabits(req.userId!);
  sendSuccess(res, result, "Today's habits");
});

/**
 * POST /api/bot/habits/check-in
 * Check in a habit by ID
 */
export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { habitId, completed, value } = req.body;
  const result = await botService.checkIn(req.userId!, habitId, completed, value);
  sendSuccess(res, result, result.message);
});

/**
 * POST /api/bot/habits/check-in-by-name
 * Find habit by name (fuzzy match) and check in
 */
export const checkInByName = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, completed, value } = req.body;
  const result = await botService.checkInByName(req.userId!, name, completed, value);

  if ('matches' in result) {
    sendSuccess(res, result, 'Multiple habits match. Please specify which one.');
  } else {
    sendSuccess(res, result, result.message);
  }
});

/**
 * GET /api/bot/habits/summary
 * Get daily summary with streaks and completion rates
 */
export const getDailySummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await botService.getDailySummary(req.userId!);
  sendSuccess(res, result, 'Daily summary');
});

/**
 * POST /api/bot/register-chat
 * Register a messaging platform chatId for reminders
 */
export const registerChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { provider, chatId, username } = req.body;
  const connectedApp = await botService.registerChat(req.userId!, provider, chatId, username);
  sendCreated(res, connectedApp, `${provider} chat registered for reminders`);
});
