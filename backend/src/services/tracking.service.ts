import prisma from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { Habit, HabitLog, Milestone, Prisma } from '@prisma/client';
import { CheckInInput, UndoCheckInInput, HistoryQuery } from '../validators/tracking.validator';
import * as habitService from './habit.service';
import logger from '../utils/logger';
import { getUserTimezone, getTodayForTimezone } from '../utils/timezone';
import { invalidateUserAnalyticsCache } from '../utils/cache';
import {
  endOfDay,
  subDays,
  format,
  eachDayOfInterval,
  isAfter,
  isBefore,
  isSameDay,
} from 'date-fns';

// ============ TYPES ============

export interface TodayHabit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  habitType: string;
  targetValue: number | null;
  unit: string | null;
  color: string;
  icon: string | null;
  category: string | null;
  currentStreak: number;
  longestStreak: number;
  isCompleted: boolean;
  logValue: number | null;
  logNotes: string | null;
  logId: string | null;
}

export interface DateHabit extends TodayHabit {
  date: string;
}

export interface HeatmapEntry {
  date: string;
  count: number;
  total: number;
  percentage: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedAt: Date | null;
}

// ============ MILESTONE THRESHOLDS ============

const STREAK_MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365, 500, 1000];
const COMPLETION_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

// ============ HELPER FUNCTIONS ============

/**
 * Parse a date string (YYYY-MM-DD) to Date object (UTC midnight)
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Format a Date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Check if a habit should be tracked on a specific date based on its frequency
 */
function shouldTrackOnDate(habit: Habit, date: Date): boolean {
  if (habit.frequency === 'DAILY') {
    return true;
  }

  if (habit.frequency === 'WEEKLY') {
    // If daysOfWeek is specified, check if the date matches
    if (habit.daysOfWeek && habit.daysOfWeek.length > 0) {
      // getDay() returns 0=Sunday, we use 1=Monday to 7=Sunday
      const dayOfWeek = date.getUTCDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      return habit.daysOfWeek.includes(adjustedDay);
    }
    // If timesPerWeek is specified, always show (user decides when)
    return true;
  }

  return true;
}

/**
 * Calculate streak for a habit
 */
async function calculateStreak(
  habitId: string,
  userId: string,
  todayOverride?: Date
): Promise<StreakInfo> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new NotFoundError('Habit', habitId);
  }

  // Get all logs for this habit, ordered by date descending
  const logs = await prisma.habitLog.findMany({
    where: { habitId, completed: true },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (logs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: habit.longestStreak,
      totalCompletions: 0,
      lastCompletedAt: null,
    };
  }

  const today = todayOverride ?? getTodayForTimezone(await getUserTimezone(userId));
  let currentStreak = 0;
  let longestStreak = habit.longestStreak;
  const lastCompletedAt = logs[0].date;

  // Calculate current streak
  let checkDate = today;
  let streakBroken = false;

  // Check if we should be tracking today
  const shouldTrackToday = shouldTrackOnDate(habit, today);

  // If today is a tracking day and not completed, start from yesterday
  const todayLog = logs.find((log) => isSameDay(log.date, today));
  if (shouldTrackToday && !todayLog) {
    // Today hasn't been completed yet, but streak might still be valid
    checkDate = subDays(today, 1);
  }

  // Count consecutive completed days
  for (const log of logs) {
    if (streakBroken) break;

    // Skip future dates
    if (isAfter(log.date, checkDate)) continue;

    // Check if this log matches the expected date
    while (isBefore(log.date, checkDate) && !streakBroken) {
      // Check if we should have tracked on checkDate
      if (shouldTrackOnDate(habit, checkDate)) {
        // We should have tracked but didn't - streak is broken
        streakBroken = true;
        break;
      }
      // Skip non-tracking days
      checkDate = subDays(checkDate, 1);
    }

    if (!streakBroken && isSameDay(log.date, checkDate)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // Update longest streak if current is higher
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions: logs.length,
    lastCompletedAt,
  };
}

/**
 * Check and award milestones for a habit
 */
async function checkMilestones(
  habitId: string,
  userId: string,
  streakInfo: StreakInfo
): Promise<Milestone[]> {
  const newMilestones: Milestone[] = [];

  // Check streak milestones
  for (const threshold of STREAK_MILESTONES) {
    if (streakInfo.currentStreak >= threshold) {
      const existing = await prisma.milestone.findUnique({
        where: {
          habitId_type_value: {
            habitId,
            type: 'STREAK',
            value: threshold,
          },
        },
      });

      if (!existing) {
        const milestone = await prisma.milestone.create({
          data: {
            habitId,
            userId,
            type: 'STREAK',
            value: threshold,
          },
        });
        newMilestones.push(milestone);
        logger.info('Streak milestone achieved', { habitId, userId, threshold });
      }
    }
  }

  // Check completion count milestones
  for (const threshold of COMPLETION_MILESTONES) {
    if (streakInfo.totalCompletions >= threshold) {
      const existing = await prisma.milestone.findUnique({
        where: {
          habitId_type_value: {
            habitId,
            type: 'COMPLETIONS',
            value: threshold,
          },
        },
      });

      if (!existing) {
        const milestone = await prisma.milestone.create({
          data: {
            habitId,
            userId,
            type: 'COMPLETIONS',
            value: threshold,
          },
        });
        newMilestones.push(milestone);
        logger.info('Completion milestone achieved', { habitId, userId, threshold });
      }
    }
  }

  return newMilestones;
}

// ============ SERVICE FUNCTIONS ============

/**
 * Get today's habits with completion status
 */
export async function getTodayHabits(
  userId: string
): Promise<{ habits: TodayHabit[]; date: string }> {
  const timezone = await getUserTimezone(userId);
  const today = getTodayForTimezone(timezone);

  // Get all active, non-archived habits
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
      isArchived: false,
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Filter habits that should be tracked today
  const todayHabits = habits.filter((habit) => shouldTrackOnDate(habit, today));

  // Get today's logs for these habits
  const habitIds = todayHabits.map((h) => h.id);
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habitIds },
      date: today,
    },
  });

  // Create a map of habitId -> log
  const logMap = new Map(logs.map((log) => [log.habitId, log]));

  // Build response
  const todayHabitList = todayHabits.map((habit) => {
    const log = logMap.get(habit.id);
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      habitType: habit.habitType,
      targetValue: habit.targetValue,
      unit: habit.unit,
      color: habit.color,
      icon: habit.icon,
      category: habit.category,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      isCompleted: log?.completed ?? false,
      logValue: log?.value ?? null,
      logNotes: log?.notes ?? null,
      logId: log?.id ?? null,
    };
  });

  return { habits: todayHabitList, date: formatDate(today) };
}

/**
 * Check in a habit (log completion)
 */
export async function checkIn(
  userId: string,
  data: CheckInInput
): Promise<{ log: HabitLog; streak: StreakInfo; milestones: Milestone[] }> {
  const timezone = await getUserTimezone(userId);
  const date = data.date ? parseDateString(data.date) : getTodayForTimezone(timezone);

  // Verify habit ownership
  await habitService.getHabitById(data.habitId, userId);

  // Check if log already exists for this date
  const existingLog = await prisma.habitLog.findUnique({
    where: {
      habitId_date: {
        habitId: data.habitId,
        date,
      },
    },
  });

  let log: HabitLog;

  if (existingLog) {
    // Update existing log
    log = await prisma.habitLog.update({
      where: { id: existingLog.id },
      data: {
        completed: data.completed,
        value: data.value,
        notes: data.notes,
      },
    });
    logger.info('Habit log updated', {
      logId: log.id,
      habitId: data.habitId,
      date: formatDate(date),
    });
  } else {
    // Create new log
    log = await prisma.habitLog.create({
      data: {
        habitId: data.habitId,
        userId,
        date,
        completed: data.completed,
        value: data.value,
        notes: data.notes,
      },
    });
    logger.info('Habit checked in', {
      logId: log.id,
      habitId: data.habitId,
      date: formatDate(date),
    });
  }

  // Recalculate streak
  const streak = await calculateStreak(data.habitId, userId);

  // Update habit with new streak info
  await prisma.habit.update({
    where: { id: data.habitId },
    data: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalCompletions: streak.totalCompletions,
      lastCompletedAt: streak.lastCompletedAt,
    },
  });

  // Check for new milestones
  const milestones = data.completed ? await checkMilestones(data.habitId, userId, streak) : [];

  // Invalidate analytics cache
  await invalidateUserAnalyticsCache(userId);

  return { log, streak, milestones };
}

/**
 * Undo a check-in (delete log)
 */
export async function undoCheckIn(userId: string, data: UndoCheckInInput): Promise<void> {
  const timezone = await getUserTimezone(userId);
  const date = data.date ? parseDateString(data.date) : getTodayForTimezone(timezone);

  // Verify habit ownership
  await habitService.getHabitById(data.habitId, userId);

  // Find and delete the log
  const log = await prisma.habitLog.findUnique({
    where: {
      habitId_date: {
        habitId: data.habitId,
        date,
      },
    },
  });

  if (!log) {
    throw new NotFoundError('Habit log for this date');
  }

  await prisma.habitLog.delete({
    where: { id: log.id },
  });

  // Recalculate streak
  const streak = await calculateStreak(data.habitId, userId);

  // Update habit with new streak info
  await prisma.habit.update({
    where: { id: data.habitId },
    data: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalCompletions: streak.totalCompletions,
      lastCompletedAt: streak.lastCompletedAt,
    },
  });

  // Invalidate analytics cache
  await invalidateUserAnalyticsCache(userId);

  logger.info('Habit check-in undone', { habitId: data.habitId, date: formatDate(date) });
}

/**
 * Get habits for a specific date
 */
export async function getHabitsByDate(userId: string, dateStr: string): Promise<DateHabit[]> {
  const date = parseDateString(dateStr);

  // Get all active habits (include archived if viewing past dates)
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Filter habits that should be tracked on this date
  const dateHabits = habits.filter((habit) => {
    // Only show habits that existed on this date
    if (isAfter(habit.createdAt, endOfDay(date))) {
      return false;
    }
    return shouldTrackOnDate(habit, date);
  });

  // Get logs for these habits on this date
  const habitIds = dateHabits.map((h) => h.id);
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habitIds },
      date,
    },
  });

  // Create a map of habitId -> log
  const logMap = new Map(logs.map((log) => [log.habitId, log]));

  // Build response
  return dateHabits.map((habit) => {
    const log = logMap.get(habit.id);
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      habitType: habit.habitType,
      targetValue: habit.targetValue,
      unit: habit.unit,
      color: habit.color,
      icon: habit.icon,
      category: habit.category,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      isCompleted: log?.completed ?? false,
      logValue: log?.value ?? null,
      logNotes: log?.notes ?? null,
      logId: log?.id ?? null,
      date: dateStr,
    };
  });
}

/**
 * Get tracking history (for calendar/heatmap)
 */
export async function getHistory(
  userId: string,
  query: HistoryQuery
): Promise<{ entries: HeatmapEntry[]; logs: HabitLog[] }> {
  const timezone = await getUserTimezone(userId);
  const endDate = query.endDate ? parseDateString(query.endDate) : getTodayForTimezone(timezone);
  const startDate = query.startDate
    ? parseDateString(query.startDate)
    : subDays(endDate, (query.limit || 90) - 1);

  // Build query conditions
  const where: Prisma.HabitLogWhereInput = {
    userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
    ...(query.habitId && { habitId: query.habitId }),
  };

  // Get all logs in the date range
  const logs = await prisma.habitLog.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      habit: {
        select: { name: true, color: true, icon: true },
      },
    },
  });

  // Get habits (include archived for historical data)
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      ...(query.habitId && { id: query.habitId }),
    },
  });

  // Generate heatmap entries
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const logsByDate = new Map<string, HabitLog[]>();

  for (const log of logs) {
    const dateKey = formatDate(log.date);
    if (!logsByDate.has(dateKey)) {
      logsByDate.set(dateKey, []);
    }
    logsByDate.get(dateKey)!.push(log);
  }

  const entries: HeatmapEntry[] = days.map((day) => {
    const dateKey = formatDate(day);
    const dayLogs = logsByDate.get(dateKey) || [];
    const completedCount = dayLogs.filter((l) => l.completed).length;

    // Count how many habits should be tracked on this day
    // A habit is trackable if it was created before or on this day
    const trackableHabits = habits.filter((h) => {
      const habitCreatedDate = new Date(
        Date.UTC(h.createdAt.getUTCFullYear(), h.createdAt.getUTCMonth(), h.createdAt.getUTCDate())
      );
      if (isAfter(habitCreatedDate, day)) return false;
      if (!h.isActive && !h.isArchived) return false; // Skip deleted habits
      return shouldTrackOnDate(h, day);
    });

    const totalHabits = query.habitId ? 1 : trackableHabits.length;

    return {
      date: dateKey,
      count: completedCount,
      total: totalHabits,
      percentage: totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0,
    };
  });

  return { entries, logs };
}

/**
 * Get milestones for a user
 */
export async function getMilestones(userId: string, habitId?: string): Promise<Milestone[]> {
  const where: Prisma.MilestoneWhereInput = {
    userId,
    ...(habitId && { habitId }),
  };

  return prisma.milestone.findMany({
    where,
    orderBy: { achievedAt: 'desc' },
    include: {
      habit: {
        select: { name: true, color: true, icon: true },
      },
    },
  });
}
