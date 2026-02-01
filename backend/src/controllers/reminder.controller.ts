import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { NotFoundError } from '../utils/AppError';
import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * GET /api/reminders
 * List all habit reminders for the current user
 */
export const getReminders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reminders = await prisma.habitReminder.findMany({
    where: { userId: req.userId! },
    include: {
      habit: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
    orderBy: { time: 'asc' },
  });

  sendSuccess(res, { reminders }, 'Reminders retrieved');
});

/**
 * POST /api/reminders
 * Create or update a habit reminder
 */
export const createReminder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { habitId, time } = req.body;
  const userId = req.userId!;

  // Verify habit ownership
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!habit) {
    throw new NotFoundError('Habit', habitId);
  }

  const reminder = await prisma.habitReminder.upsert({
    where: { habitId },
    update: { time, isActive: true },
    create: { habitId, userId, time },
    include: {
      habit: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
  });

  logger.info('Reminder created/updated', { userId, habitId, time });
  sendCreated(res, { reminder }, 'Reminder set');
});

/**
 * DELETE /api/reminders/:habitId
 * Delete a reminder for a habit
 */
export const deleteReminder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const habitId = req.params.habitId as string;

  const reminder = await prisma.habitReminder.findFirst({
    where: { habitId, userId: req.userId! },
  });

  if (!reminder) {
    throw new NotFoundError('Reminder for habit', habitId);
  }

  await prisma.habitReminder.delete({
    where: { id: reminder.id },
  });

  logger.info('Reminder deleted', { userId: req.userId, habitId });
  sendNoContent(res);
});

/**
 * GET /api/reminders/settings
 * Get notification settings
 */
export const getNotificationSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await prisma.userNotificationSettings.findUnique({
    where: { userId: req.userId! },
  });

  if (!settings) {
    // Return defaults
    settings = {
      id: '',
      userId: req.userId!,
      dailySummaryEnabled: false,
      dailySummaryTime: null,
      reminderEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  sendSuccess(
    res,
    {
      settings: {
        dailySummaryEnabled: settings.dailySummaryEnabled,
        dailySummaryTime: settings.dailySummaryTime,
        reminderEnabled: settings.reminderEnabled,
      },
    },
    'Notification settings retrieved'
  );
});

/**
 * PUT /api/reminders/settings
 * Update notification settings
 */
export const updateNotificationSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { dailySummaryEnabled, dailySummaryTime, reminderEnabled } = req.body;

  const data: Record<string, unknown> = {};
  if (dailySummaryEnabled !== undefined) data.dailySummaryEnabled = dailySummaryEnabled;
  if (dailySummaryTime !== undefined) data.dailySummaryTime = dailySummaryTime;
  if (reminderEnabled !== undefined) data.reminderEnabled = reminderEnabled;

  const settings = await prisma.userNotificationSettings.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      dailySummaryEnabled: dailySummaryEnabled ?? false,
      dailySummaryTime: dailySummaryTime ?? null,
      reminderEnabled: reminderEnabled ?? true,
    },
  });

  logger.info('Notification settings updated', { userId });
  sendSuccess(
    res,
    {
      settings: {
        dailySummaryEnabled: settings.dailySummaryEnabled,
        dailySummaryTime: settings.dailySummaryTime,
        reminderEnabled: settings.reminderEnabled,
      },
    },
    'Notification settings updated'
  );
});
