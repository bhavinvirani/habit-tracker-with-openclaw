import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../utils/AppError';
import { Prisma, Habit, Frequency, HabitType } from '@prisma/client';
import { CreateHabitInput, UpdateHabitInput } from '../validators/habit.validator';
import logger from '../utils/logger';
import { invalidateUserAnalyticsCache } from '../utils/cache';

// ============ TYPES ============

export interface HabitWithStats extends Habit {
  completionRate?: number;
}

export interface HabitFilters {
  userId: string;
  isActive?: boolean;
  isArchived?: boolean;
  category?: string;
  frequency?: Frequency;
  limit?: number;
  offset?: number;
}

// ============ SERVICE FUNCTIONS ============

/**
 * Create a new habit
 */
export async function createHabit(
  userId: string,
  data: CreateHabitInput,
  templateId?: string
): Promise<Habit> {
  // Get max sortOrder for user's habits
  const maxOrderResult = await prisma.habit.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (maxOrderResult._max.sortOrder ?? -1) + 1;

  const habitData: Prisma.HabitCreateInput = {
    user: { connect: { id: userId } },
    name: data.name,
    description: data.description,
    frequency: data.frequency as Frequency,
    daysOfWeek: data.daysOfWeek ?? [],
    timesPerWeek: data.timesPerWeek,
    habitType: (data.habitType as HabitType) || 'BOOLEAN',
    targetValue: data.targetValue,
    unit: data.unit,
    color: data.color,
    icon: data.icon,
    category: data.category,
    sortOrder: nextSortOrder,
  };

  // Only connect template if templateId is provided
  if (templateId) {
    habitData.template = { connect: { id: templateId } };
  }

  const habit = await prisma.habit.create({
    data: habitData,
  });

  logger.info('Habit created', { habitId: habit.id, userId, name: habit.name });
  await invalidateUserAnalyticsCache(userId);
  return habit;
}

/**
 * Get all habits for a user with optional filters
 */
export async function getHabits(
  filters: HabitFilters
): Promise<{ habits: HabitWithStats[]; total: number; limit: number; offset: number }> {
  const where: Prisma.HabitWhereInput = {
    userId: filters.userId,
  };

  // Default: show active, non-archived habits
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  if (filters.isArchived !== undefined) {
    where.isArchived = filters.isArchived;
  } else {
    where.isArchived = false; // Default: hide archived
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.frequency) {
    where.frequency = filters.frequency;
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [habits, total] = await Promise.all([
    prisma.habit.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.habit.count({ where }),
  ]);

  // Calculate completionRate for each habit based on last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const habitsWithStats: HabitWithStats[] = await Promise.all(
    habits.map(async (habit) => {
      // Get logs for this habit in the last 30 days
      const logs = await prisma.habitLog.findMany({
        where: {
          habitId: habit.id,
          date: { gte: thirtyDaysAgo, lte: now },
          completed: true,
        },
      });

      // Calculate expected days based on frequency
      let expectedDays = 0;
      if (habit.frequency === 'DAILY') {
        expectedDays = 30;
      } else if (habit.frequency === 'WEEKLY') {
        // Weekly habits: count how many expected days in 30 days
        if (habit.daysOfWeek && habit.daysOfWeek.length > 0) {
          // Specific days: multiply by ~4 weeks
          expectedDays = habit.daysOfWeek.length * 4;
        } else if (habit.timesPerWeek) {
          // X times per week (any days)
          expectedDays = habit.timesPerWeek * 4;
        } else {
          // Fallback: once per week
          expectedDays = 4;
        }
      } else {
        expectedDays = 30; // Default to daily
      }

      const completionRate = expectedDays > 0 ? Math.round((logs.length / expectedDays) * 100) : 0;

      return {
        ...habit,
        completionRate: Math.min(completionRate, 100), // Cap at 100%
      };
    })
  );

  return { habits: habitsWithStats, total, limit, offset };
}

/**
 * Get a single habit by ID (with ownership check)
 */
export async function getHabitById(habitId: string, userId: string): Promise<Habit> {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
    },
  });

  if (!habit) {
    throw new NotFoundError('Habit', habitId);
  }

  return habit;
}

/**
 * Update a habit
 */
export async function updateHabit(
  habitId: string,
  userId: string,
  data: UpdateHabitInput
): Promise<Habit> {
  // Verify ownership
  await getHabitById(habitId, userId);

  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.frequency !== undefined && { frequency: data.frequency as Frequency }),
      ...(data.daysOfWeek !== undefined && { daysOfWeek: data.daysOfWeek ?? [] }),
      ...(data.timesPerWeek !== undefined && { timesPerWeek: data.timesPerWeek }),
      ...(data.habitType !== undefined && { habitType: data.habitType as HabitType }),
      ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  logger.info('Habit updated', { habitId, userId });
  await invalidateUserAnalyticsCache(userId);
  return habit;
}

/**
 * Delete a habit (and all associated logs/milestones via cascade)
 */
export async function deleteHabit(habitId: string, userId: string): Promise<void> {
  // Verify ownership
  await getHabitById(habitId, userId);

  await prisma.habit.delete({
    where: { id: habitId },
  });

  logger.info('Habit deleted', { habitId, userId });
  await invalidateUserAnalyticsCache(userId);
}

/**
 * Archive a habit
 */
export async function archiveHabit(habitId: string, userId: string): Promise<Habit> {
  // Verify ownership
  await getHabitById(habitId, userId);

  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      isArchived: true,
      isActive: false,
    },
  });

  logger.info('Habit archived', { habitId, userId });
  await invalidateUserAnalyticsCache(userId);
  return habit;
}

/**
 * Unarchive a habit
 */
export async function unarchiveHabit(habitId: string, userId: string): Promise<Habit> {
  // Verify ownership
  const existing = await getHabitById(habitId, userId);

  if (!existing.isArchived) {
    throw new ConflictError('Habit is not archived');
  }

  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      isArchived: false,
      isActive: true,
    },
  });

  logger.info('Habit unarchived', { habitId, userId });
  await invalidateUserAnalyticsCache(userId);
  return habit;
}

/**
 * Get all archived habits for a user
 */
export async function getArchivedHabits(userId: string): Promise<Habit[]> {
  return prisma.habit.findMany({
    where: {
      userId,
      isArchived: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Reorder habits
 */
export async function reorderHabits(userId: string, habitIds: string[]): Promise<void> {
  // Verify all habits belong to user
  const habits = await prisma.habit.findMany({
    where: {
      id: { in: habitIds },
      userId,
    },
    select: { id: true },
  });

  if (habits.length !== habitIds.length) {
    throw new NotFoundError('One or more habits not found or do not belong to you');
  }

  // Update sort order in a transaction
  await prisma.$transaction(
    habitIds.map((id, index) =>
      prisma.habit.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  logger.info('Habits reordered', { userId, count: habitIds.length });
}

/**
 * Pause a habit (vacation mode) - preserves streak
 */
export async function pauseHabit(
  habitId: string,
  userId: string,
  pausedUntil?: string,
  reason?: string
): Promise<Habit> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new NotFoundError('Habit not found');
  }

  const updated = await prisma.habit.update({
    where: { id: habitId },
    data: {
      isPaused: true,
      pausedAt: new Date(),
      pausedUntil: pausedUntil ? new Date(pausedUntil) : null,
      pauseReason: reason || null,
    },
  });

  logger.info('Habit paused', { habitId, userId, pausedUntil });
  await invalidateUserAnalyticsCache(userId);
  return updated;
}

/**
 * Resume a paused habit
 */
export async function resumeHabit(habitId: string, userId: string): Promise<Habit> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new NotFoundError('Habit not found');
  }

  const updated = await prisma.habit.update({
    where: { id: habitId },
    data: {
      isPaused: false,
      pausedAt: null,
      pausedUntil: null,
      pauseReason: null,
    },
  });

  logger.info('Habit resumed', { habitId, userId });
  await invalidateUserAnalyticsCache(userId);
  return updated;
}

/**
 * Stack a habit after another (habit chaining)
 */
export async function stackHabit(
  habitId: string,
  userId: string,
  afterHabitId: string | null
): Promise<Habit> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new NotFoundError('Habit not found');
  }

  // Validate afterHabitId if provided
  if (afterHabitId) {
    const afterHabit = await prisma.habit.findFirst({
      where: { id: afterHabitId, userId },
    });

    if (!afterHabit) {
      throw new NotFoundError('Target habit not found');
    }

    // Prevent circular stacking
    if (afterHabit.stackedAfterHabitId === habitId) {
      throw new ConflictError('Cannot create circular habit stacking');
    }
  }

  const updated = await prisma.habit.update({
    where: { id: habitId },
    data: {
      stackedAfterHabitId: afterHabitId,
    },
    include: {
      stackedAfterHabit: {
        select: { id: true, name: true, color: true, icon: true },
      },
    },
  });

  logger.info('Habit stacked', { habitId, afterHabitId, userId });
  return updated;
}

/**
 * Get all unique categories for a user
 */
export async function getCategories(
  userId: string
): Promise<{ name: string; habitCount: number }[]> {
  const habits = await prisma.habit.groupBy({
    by: ['category'],
    where: {
      userId,
      isArchived: false,
      category: { not: null },
    },
    _count: { id: true },
  });

  return habits
    .filter((h: { category: string | null }) => h.category !== null)
    .map((h: { category: string | null; _count: { id: number } }) => ({
      name: h.category!,
      habitCount: h._count.id,
    }));
}

// ============ DEFAULT CATEGORIES ============

export const DEFAULT_CATEGORIES = [
  'Health',
  'Fitness',
  'Productivity',
  'Learning',
  'Mindfulness',
  'Finance',
  'Social',
  'Creative',
  'Other',
];
