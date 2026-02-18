import cron from 'node-cron';
import { Frequency, HabitType, MilestoneType, BookStatus, ChallengeStatus } from '@prisma/client';
import prisma from '../config/database';
import logger from '../utils/logger';
import { registerCronJob, reportCronRun } from '../utils/cronTracker';

// ============ COMPLETION RATE CONFIG ============

interface HabitConfig {
  weekdayRate: number;
  weekendRate: number;
  valueMin?: number;
  valueMax?: number;
}

const HABIT_RATES: Record<string, HabitConfig> = {
  'habit-exercise': { weekdayRate: 0.9, weekendRate: 0.8, valueMin: 25, valueMax: 45 },
  'habit-reading': { weekdayRate: 0.75, weekendRate: 0.75, valueMin: 15, valueMax: 40 },
  'habit-meditation': { weekdayRate: 0.8, weekendRate: 0.85, valueMin: 8, valueMax: 20 },
  'habit-water': { weekdayRate: 0.92, weekendRate: 0.88, valueMin: 6, valueMax: 10 },
  'habit-journal': { weekdayRate: 0.65, weekendRate: 0.6 },
  'habit-coding': { weekdayRate: 0.8, weekendRate: 0.4, valueMin: 45, valueMax: 90 },
  'habit-no-social': { weekdayRate: 0.5, weekendRate: 0.35 },
  'habit-vitamins': { weekdayRate: 0.93, weekendRate: 0.9 },
  'habit-planning': { weekdayRate: 0, weekendRate: 0.85 },
  'habit-gym': { weekdayRate: 0.78, weekendRate: 0 },
  'habit-family': { weekdayRate: 0, weekendRate: 0.8 },
  'habit-clean': { weekdayRate: 0, weekendRate: 0.72 },
};

const DEFAULT_RATE: HabitConfig = { weekdayRate: 0.7, weekendRate: 0.6 };

const STREAK_THRESHOLDS = [7, 14, 21, 30, 60, 90, 100, 180, 365, 500, 1000];
const COMPLETION_THRESHOLDS = [10, 25, 50, 100, 250, 500, 1000];

// ============ HELPERS ============

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Convert JS getDay() (0=Sun) to ISO day (1=Mon..7=Sun) */
function isoDay(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}

function shouldTrackToday(
  habit: { frequency: Frequency; daysOfWeek: number[] },
  date: Date
): boolean {
  if (habit.frequency === Frequency.DAILY) return true;
  if (habit.daysOfWeek.length > 0) {
    return habit.daysOfWeek.includes(isoDay(date));
  }
  return true; // WEEKLY with timesPerWeek — user decides when
}

function generateValue(
  habit: { habitType: HabitType; targetValue: number | null },
  config: HabitConfig
): number | null {
  if (habit.habitType === HabitType.BOOLEAN) return null;
  if (!habit.targetValue) return null;

  // Use config range if defined, otherwise ±30% of target
  const min = config.valueMin ?? Math.floor(habit.targetValue * 0.7);
  const max = config.valueMax ?? Math.ceil(habit.targetValue * 1.3);
  return randInt(min, max);
}

// ============ MAIN SEED FUNCTION ============

async function seedDemoUserData(): Promise<void> {
  const email = process.env.DEMO_USER_EMAIL || 'test@example.com';
  if (!email) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn('Demo seeder: user not found', { email });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekend = isWeekend(today);

  // A. Seed habit logs
  const habits = await prisma.habit.findMany({
    where: { userId: user.id, isActive: true, isArchived: false },
  });

  const completedHabitIds = new Set<string>();
  let logsCreated = 0;

  for (const habit of habits) {
    try {
      if (!shouldTrackToday(habit, today)) continue;

      const config = HABIT_RATES[habit.id] || DEFAULT_RATE;
      const rate = weekend ? config.weekendRate : config.weekdayRate;
      const completed = Math.random() < rate;

      if (!completed) continue;

      const value = generateValue(habit, config);

      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: habit.id, date: today } },
        update: { completed: true, value },
        create: {
          habitId: habit.id,
          userId: user.id,
          date: today,
          completed: true,
          value,
        },
      });

      completedHabitIds.add(habit.id);
      logsCreated++;
    } catch (err) {
      logger.warn('Demo seeder: failed to create log', {
        habitId: habit.id,
        error: (err as Error).message,
      });
    }
  }

  // B. Update streaks for all habits
  for (const habit of habits) {
    try {
      const logs = await prisma.habitLog.findMany({
        where: { habitId: habit.id, completed: true },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      const totalCompletions = logs.length;
      const sortedDates = logs.map((l) => new Date(l.date).getTime());

      // Current streak (from today backwards)
      let currentStreak = 0;
      let checkDate = today.getTime();
      for (const logDate of sortedDates) {
        const daysDiff = Math.round((checkDate - logDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak++;
          checkDate = logDate;
        } else {
          break;
        }
      }

      // Longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const uniqueDates = Array.from(new Set(sortedDates)).sort((a, b) => a - b);
      for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const diff = Math.round((uniqueDates[i] - uniqueDates[i - 1]) / (1000 * 60 * 60 * 24));
          tempStreak = diff === 1 ? tempStreak + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      const lastCompletedAt = logs.length > 0 ? logs[0].date : null;

      await prisma.habit.update({
        where: { id: habit.id },
        data: { currentStreak, longestStreak, totalCompletions, lastCompletedAt },
      });
    } catch (err) {
      logger.warn('Demo seeder: failed to update streak', {
        habitId: habit.id,
        error: (err as Error).message,
      });
    }
  }

  // C. Check milestones for completed habits
  for (const habitId of completedHabitIds) {
    try {
      const habit = await prisma.habit.findUnique({
        where: { id: habitId },
        select: { currentStreak: true, totalCompletions: true },
      });
      if (!habit) continue;

      for (const threshold of STREAK_THRESHOLDS) {
        if (habit.currentStreak >= threshold) {
          await prisma.milestone.upsert({
            where: {
              habitId_type_value: { habitId, type: MilestoneType.STREAK, value: threshold },
            },
            update: {},
            create: {
              habitId,
              userId: user.id,
              type: MilestoneType.STREAK,
              value: threshold,
            },
          });
        }
      }

      for (const threshold of COMPLETION_THRESHOLDS) {
        if (habit.totalCompletions >= threshold) {
          await prisma.milestone.upsert({
            where: {
              habitId_type_value: { habitId, type: MilestoneType.COMPLETIONS, value: threshold },
            },
            update: {},
            create: {
              habitId,
              userId: user.id,
              type: MilestoneType.COMPLETIONS,
              value: threshold,
            },
          });
        }
      }
    } catch (err) {
      logger.warn('Demo seeder: failed to check milestones', {
        habitId,
        error: (err as Error).message,
      });
    }
  }

  // D. Update book progress
  try {
    const readingBooks = await prisma.book.findMany({
      where: { userId: user.id, status: BookStatus.READING },
    });

    for (const book of readingBooks) {
      if (Math.random() > 0.7) continue; // 70% chance of reading

      const pagesRead = randInt(10, 25);
      const newPage = Math.min((book.currentPage || 0) + pagesRead, book.totalPages || 9999);

      await prisma.readingLog.upsert({
        where: { bookId_date: { bookId: book.id, date: today } },
        update: { pagesRead },
        create: { bookId: book.id, date: today, pagesRead },
      });

      const finished = book.totalPages && newPage >= book.totalPages;
      await prisma.book.update({
        where: { id: book.id },
        data: {
          currentPage: newPage,
          ...(finished
            ? {
                status: BookStatus.FINISHED,
                finishedAt: today,
                rating: randInt(4, 5),
              }
            : {}),
        },
      });
    }
  } catch (err) {
    logger.warn('Demo seeder: failed to update books', { error: (err as Error).message });
  }

  // E. Update challenge progress
  try {
    const activeChallenges = await prisma.challenge.findMany({
      where: { userId: user.id, status: ChallengeStatus.ACTIVE },
      include: { habits: { select: { habitId: true } } },
    });

    for (const challenge of activeChallenges) {
      const linkedHabitIds = challenge.habits.map((h) => h.habitId);
      const habitsCompleted = linkedHabitIds.filter((id) => completedHabitIds.has(id)).length;

      await prisma.challengeProgress.upsert({
        where: { challengeId_date: { challengeId: challenge.id, date: today } },
        update: { habitsCompleted, habitsTotal: linkedHabitIds.length },
        create: {
          challengeId: challenge.id,
          userId: user.id,
          date: today,
          habitsCompleted,
          habitsTotal: linkedHabitIds.length,
        },
      });

      // Finalize expired challenges
      if (challenge.endDate < today) {
        const allProgress = await prisma.challengeProgress.findMany({
          where: { challengeId: challenge.id },
        });

        const totalPossible = allProgress.reduce((sum, p) => sum + p.habitsTotal, 0);
        const totalDone = allProgress.reduce((sum, p) => sum + p.habitsCompleted, 0);
        const completionRate = totalPossible > 0 ? (totalDone / totalPossible) * 100 : 0;

        await prisma.challenge.update({
          where: { id: challenge.id },
          data: {
            status: completionRate >= 70 ? ChallengeStatus.COMPLETED : ChallengeStatus.FAILED,
            completionRate: Math.round(completionRate * 100) / 100,
          },
        });
      }
    }
  } catch (err) {
    logger.warn('Demo seeder: failed to update challenges', { error: (err as Error).message });
  }

  logger.info('Demo seeder: daily seed complete', {
    user: email,
    logsCreated,
    habitsCompleted: completedHabitIds.size,
    totalHabits: habits.length,
  });
}

// ============ CRON SCHEDULER ============

export function initDemoSeeder(): void {
  if (process.env.NODE_ENV === 'test') return;
  if (!process.env.DEMO_USER_EMAIL) return;

  registerCronJob('demoSeeder', '5 0 * * *');

  // Run daily at 00:05 UTC
  cron.schedule('5 0 * * *', async () => {
    const start = Date.now();
    try {
      await seedDemoUserData();
      reportCronRun('demoSeeder', 'success', Date.now() - start);
    } catch (err) {
      reportCronRun('demoSeeder', 'failure', Date.now() - start, (err as Error).message);
      logger.error('Demo seeder: cron job failed', { error: (err as Error).message });
    }
  });

  logger.info('Demo seeder initialized', { email: process.env.DEMO_USER_EMAIL });
}
