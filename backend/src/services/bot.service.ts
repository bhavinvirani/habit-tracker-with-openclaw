import prisma from '../config/database';
import { NotFoundError } from '../utils/AppError';
import * as trackingService from './tracking.service';
import { getUserTimezone, getTodayForTimezone } from '../utils/timezone';
import logger from '../utils/logger';

// ============ TYPES ============

export interface BotHabit {
  id: string;
  name: string;
  type: string;
  target: number | null;
  unit: string | null;
  category: string | null;
  completed: boolean;
  currentValue: number | null;
  streak: number;
}

export interface BotCheckInResult {
  habit: string;
  status: string;
  completed: boolean;
  streak: number;
  message: string;
}

// ============ SERVICE FUNCTIONS ============

/**
 * Get today's habits in a bot-friendly format
 */
export async function getTodayHabits(userId: string) {
  const { habits, date } = await trackingService.getTodayHabits(userId);

  const botHabits: BotHabit[] = habits.map((h) => ({
    id: h.id,
    name: h.name,
    type: h.habitType,
    target: h.targetValue,
    unit: h.unit,
    category: h.category,
    completed: h.isCompleted,
    currentValue: h.logValue,
    streak: h.currentStreak,
  }));

  const completed = botHabits.filter((h) => h.completed).length;

  return {
    date,
    habits: botHabits,
    summary: {
      total: botHabits.length,
      completed,
      remaining: botHabits.length - completed,
    },
  };
}

/**
 * Check in a habit and return bot-friendly response
 */
export async function checkIn(
  userId: string,
  habitId: string,
  completed: boolean,
  value?: number
): Promise<BotCheckInResult> {
  const result = await trackingService.checkIn(userId, {
    habitId,
    completed,
    value,
  });

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { name: true, habitType: true, targetValue: true, unit: true, currentStreak: true },
  });

  if (!habit) {
    throw new NotFoundError('Habit', habitId);
  }

  let status: string;
  let message: string;

  if (habit.habitType === 'BOOLEAN') {
    status = completed ? 'Done' : 'Not done';
    message = completed
      ? `Logged: ${habit.name} - Done!`
      : `Logged: ${habit.name} - Marked incomplete.`;
  } else {
    const currentVal = result.log.value ?? 0;
    const target = habit.targetValue ?? 0;
    const unitLabel = habit.unit ?? '';
    status =
      target > 0
        ? `${currentVal}/${target} ${unitLabel}`.trim()
        : `${currentVal} ${unitLabel}`.trim();
    const isDone = target > 0 && currentVal >= target;
    message = `Logged: ${habit.name} - ${status}.${isDone ? ' Goal reached!' : ''}`;
  }

  return {
    habit: habit.name,
    status,
    completed: result.log.completed,
    streak: result.streak.currentStreak,
    message: `${message} Streak: ${result.streak.currentStreak} days.`,
  };
}

/**
 * Find habit by name (fuzzy match) and check in
 * Returns the result if a single match is found, or a list of matches if ambiguous
 */
export async function checkInByName(
  userId: string,
  name: string,
  completed: boolean,
  value?: number
): Promise<BotCheckInResult | { matches: BotHabit[] }> {
  const timezone = await getUserTimezone(userId);
  const today = getTodayForTimezone(timezone);

  // Get all active, non-archived habits
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
      isArchived: false,
      isPaused: false,
    },
    select: {
      id: true,
      name: true,
      habitType: true,
      targetValue: true,
      unit: true,
      category: true,
      currentStreak: true,
    },
  });

  // Get today's logs for completion status
  const habitIds = habits.map((h) => h.id);
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habitIds },
      date: today,
    },
  });
  const logMap = new Map(logs.map((log) => [log.habitId, log]));

  // Fuzzy match: score each habit
  const query = name.toLowerCase().trim();
  const scored = habits
    .map((h) => {
      const habitName = h.name.toLowerCase();
      const category = (h.category ?? '').toLowerCase();
      const unit = (h.unit ?? '').toLowerCase();

      let score = 0;

      // Exact match
      if (habitName === query) score = 100;
      // Starts with query
      else if (habitName.startsWith(query)) score = 80;
      // Contains query
      else if (habitName.includes(query)) score = 60;
      // Query words match habit name words
      else {
        const queryWords = query.split(/\s+/);
        const habitWords = habitName.split(/\s+/);
        const matchingWords = queryWords.filter(
          (qw) =>
            habitWords.some((hw) => hw.includes(qw)) || category.includes(qw) || unit.includes(qw)
        );
        if (matchingWords.length > 0) {
          score = 20 + (matchingWords.length / queryWords.length) * 30;
        }
      }

      return { habit: h, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    logger.info('No habit match found', { userId, query: name });
    throw new NotFoundError(`No habit matching "${name}"`);
  }

  // Single strong match (score >= 60) or only one match
  if (scored.length === 1 || (scored[0].score >= 60 && scored[0].score > scored[1]?.score + 20)) {
    const match = scored[0].habit;
    return checkIn(userId, match.id, completed, value);
  }

  // Ambiguous: return top matches
  const topMatches = scored.slice(0, 5).map((s) => {
    const log = logMap.get(s.habit.id);
    return {
      id: s.habit.id,
      name: s.habit.name,
      type: s.habit.habitType,
      target: s.habit.targetValue,
      unit: s.habit.unit,
      category: s.habit.category,
      completed: log?.completed ?? false,
      currentValue: log?.value ?? null,
      streak: s.habit.currentStreak,
    };
  });

  logger.info('Ambiguous habit match', { userId, query: name, matchCount: topMatches.length });
  return { matches: topMatches };
}

/**
 * Get daily summary with streaks and completion rates
 */
export async function getDailySummary(userId: string) {
  const { habits, date } = await trackingService.getTodayHabits(userId);

  const completed = habits.filter((h) => h.isCompleted);
  const remaining = habits.filter((h) => !h.isCompleted);

  return {
    date,
    summary: {
      total: habits.length,
      completed: completed.length,
      remaining: remaining.length,
      percentage: habits.length > 0 ? Math.round((completed.length / habits.length) * 100) : 0,
    },
    completedHabits: completed.map((h) => ({
      name: h.name,
      streak: h.currentStreak,
    })),
    remainingHabits: remaining.map((h) => ({
      name: h.name,
      streak: h.currentStreak,
    })),
  };
}

/**
 * Register a messaging platform chat for a user
 */
export async function registerChat(
  userId: string,
  provider: string,
  chatId: string,
  username?: string
) {
  const connectedApp = await prisma.connectedApp.upsert({
    where: {
      userId_provider: { userId, provider },
    },
    update: {
      chatId,
      username,
      isActive: true,
    },
    create: {
      userId,
      provider,
      chatId,
      username,
      isActive: true,
    },
  });

  logger.info('Chat registered', { userId, provider, chatId });
  return connectedApp;
}
