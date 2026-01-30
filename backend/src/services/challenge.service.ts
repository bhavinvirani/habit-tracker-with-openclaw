import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import {
  CreateChallengeInput,
  UpdateChallengeInput,
  ChallengeQueryInput,
  SyncProgressInput,
} from '../validators/challenge.validator';
import { ChallengeStatus } from '@prisma/client';
import { format, parseISO, addDays, differenceInDays, isWithinInterval } from 'date-fns';

// ============ GET ALL CHALLENGES ============
export const getChallenges = async (userId: string, query: ChallengeQueryInput) => {
  const { status, includeCompleted, limit, offset } = query;

  const where: { userId: string; status?: ChallengeStatus | { in: ChallengeStatus[] } } = {
    userId,
  };

  if (status) {
    where.status = status as ChallengeStatus;
  } else if (!includeCompleted) {
    where.status = { in: ['ACTIVE'] };
  }

  const [challenges, total] = await Promise.all([
    prisma.challenge.findMany({
      where,
      include: {
        habits: {
          include: {
            habit: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: { progress: true },
        },
      },
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.challenge.count({ where }),
  ]);

  // Calculate progress for each challenge
  const enrichedChallenges = challenges.map((challenge) => {
    const today = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);

    const totalDays = challenge.duration;
    const daysElapsed = Math.min(Math.max(0, differenceInDays(today, startDate) + 1), totalDays);
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));

    return {
      ...challenge,
      habits: challenge.habits.map((h) => h.habit),
      daysElapsed,
      daysRemaining,
      progressPercentage: Math.round((daysElapsed / totalDays) * 100),
    };
  });

  return { challenges: enrichedChallenges, total, limit, offset };
};

// ============ GET CHALLENGE BY ID ============
export const getChallengeById = async (userId: string, challengeId: string) => {
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, userId },
    include: {
      habits: {
        include: {
          habit: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
              currentStreak: true,
            },
          },
        },
      },
      progress: {
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!challenge) {
    throw new NotFoundError('Challenge not found');
  }

  // Calculate detailed stats
  const today = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);

  const totalDays = challenge.duration;
  const daysElapsed = Math.min(Math.max(0, differenceInDays(today, startDate) + 1), totalDays);
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));

  // Calculate completion rate from progress
  const totalPossible = challenge.progress.reduce((sum, p) => sum + p.habitsTotal, 0);
  const totalCompleted = challenge.progress.reduce((sum, p) => sum + p.habitsCompleted, 0);
  const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return {
    ...challenge,
    habits: challenge.habits.map((h) => h.habit),
    daysElapsed,
    daysRemaining,
    progressPercentage: Math.round((daysElapsed / totalDays) * 100),
    completionRate,
    isActive:
      challenge.status === 'ACTIVE' && isWithinInterval(today, { start: startDate, end: endDate }),
  };
};

// ============ CREATE CHALLENGE ============
export const createChallenge = async (userId: string, data: CreateChallengeInput) => {
  const { name, description, duration, startDate, habitIds } = data;

  // Verify all habits belong to user
  const habits = await prisma.habit.findMany({
    where: {
      id: { in: habitIds },
      userId,
      isArchived: false,
    },
  });

  if (habits.length !== habitIds.length) {
    throw new BadRequestError('Some habits were not found or are archived');
  }

  const start = parseISO(startDate);
  const end = addDays(start, duration - 1);

  const challenge = await prisma.challenge.create({
    data: {
      userId,
      name,
      description,
      duration,
      startDate: start,
      endDate: end,
      habits: {
        create: habitIds.map((habitId) => ({ habitId })),
      },
    },
    include: {
      habits: {
        include: {
          habit: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    },
  });

  return {
    ...challenge,
    habits: challenge.habits.map((h) => h.habit),
  };
};

// ============ UPDATE CHALLENGE ============
export const updateChallenge = async (
  userId: string,
  challengeId: string,
  data: UpdateChallengeInput
) => {
  const existing = await prisma.challenge.findFirst({
    where: { id: challengeId, userId },
  });

  if (!existing) {
    throw new NotFoundError('Challenge not found');
  }

  // Only allow updating name/description for active challenges
  if (existing.status !== 'ACTIVE' && data.status === undefined) {
    throw new BadRequestError('Cannot update completed or cancelled challenges');
  }

  const challenge = await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      name: data.name,
      description: data.description,
      status: data.status as ChallengeStatus,
    },
    include: {
      habits: {
        include: {
          habit: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    },
  });

  return {
    ...challenge,
    habits: challenge.habits.map((h) => h.habit),
  };
};

// ============ DELETE CHALLENGE ============
export const deleteChallenge = async (userId: string, challengeId: string) => {
  const existing = await prisma.challenge.findFirst({
    where: { id: challengeId, userId },
  });

  if (!existing) {
    throw new NotFoundError('Challenge not found');
  }

  await prisma.challenge.delete({
    where: { id: challengeId },
  });

  return { deleted: true };
};

// ============ SYNC PROGRESS ============
export const syncProgress = async (
  userId: string,
  challengeId: string,
  data: SyncProgressInput
) => {
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, userId },
    include: {
      habits: true,
    },
  });

  if (!challenge) {
    throw new NotFoundError('Challenge not found');
  }

  if (challenge.status !== 'ACTIVE') {
    throw new BadRequestError('Challenge is not active');
  }

  const targetDate = data.date ? parseISO(data.date) : new Date();
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  // Check if date is within challenge period
  if (targetDate < challenge.startDate || targetDate > challenge.endDate) {
    throw new BadRequestError('Date is outside challenge period');
  }

  // Get habit logs for this date
  const habitIds = challenge.habits.map((h) => h.habitId);
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habitIds },
      userId,
      date: parseISO(dateStr),
      completed: true,
    },
  });

  const habitsCompleted = logs.length;
  const habitsTotal = habitIds.length;

  // Upsert progress
  const progress = await prisma.challengeProgress.upsert({
    where: {
      challengeId_date: {
        challengeId,
        date: parseISO(dateStr),
      },
    },
    create: {
      challengeId,
      userId,
      date: parseISO(dateStr),
      habitsCompleted,
      habitsTotal,
    },
    update: {
      habitsCompleted,
      habitsTotal,
    },
  });

  return progress;
};

// ============ GET CHALLENGE PROGRESS ============
export const getChallengeProgress = async (userId: string, challengeId: string) => {
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, userId },
    include: {
      habits: {
        include: {
          habit: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      },
      progress: {
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!challenge) {
    throw new NotFoundError('Challenge not found');
  }

  const habitIds = challenge.habits.map((h) => h.habitId);

  // Get all habit logs within challenge period
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habitIds },
      userId,
      date: {
        gte: challenge.startDate,
        lte: challenge.endDate,
      },
      completed: true,
    },
  });

  // Build daily breakdown
  const dailyBreakdown: Array<{
    date: string;
    habitsCompleted: number;
    habitsTotal: number;
    percentage: number;
    habits: Array<{ id: string; name: string; completed: boolean }>;
  }> = [];

  const today = new Date();
  let currentDate = new Date(challenge.startDate);

  while (currentDate <= challenge.endDate && currentDate <= today) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayLogs = logs.filter((l) => format(l.date, 'yyyy-MM-dd') === dateStr);
    const completedIds = new Set(dayLogs.map((l) => l.habitId));

    dailyBreakdown.push({
      date: dateStr,
      habitsCompleted: dayLogs.length,
      habitsTotal: habitIds.length,
      percentage: Math.round((dayLogs.length / habitIds.length) * 100),
      habits: challenge.habits.map((h) => ({
        id: h.habit.id,
        name: h.habit.name,
        completed: completedIds.has(h.habitId),
      })),
    });

    currentDate = addDays(currentDate, 1);
  }

  // Calculate streak within challenge
  let currentStreak = 0;
  for (let i = dailyBreakdown.length - 1; i >= 0; i--) {
    if (dailyBreakdown[i].percentage === 100) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Perfect days count
  const perfectDays = dailyBreakdown.filter((d) => d.percentage === 100).length;

  return {
    challenge: {
      id: challenge.id,
      name: challenge.name,
      duration: challenge.duration,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      status: challenge.status,
    },
    habits: challenge.habits.map((h) => h.habit),
    dailyBreakdown,
    summary: {
      daysCompleted: dailyBreakdown.length,
      perfectDays,
      currentStreak,
      overallCompletion:
        dailyBreakdown.length > 0
          ? Math.round(
              dailyBreakdown.reduce((sum, d) => sum + d.percentage, 0) / dailyBreakdown.length
            )
          : 0,
    },
  };
};

// ============ CHECK AND UPDATE CHALLENGE STATUS ============
export const checkChallengeStatus = async (userId: string) => {
  const today = new Date();

  // Find active challenges that have ended
  const expiredChallenges = await prisma.challenge.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { lt: today },
    },
    include: {
      progress: true,
      habits: true,
    },
  });

  for (const challenge of expiredChallenges) {
    // Calculate completion rate
    const totalPossible = challenge.duration * challenge.habits.length;
    const totalCompleted = challenge.progress.reduce((sum, p) => sum + p.habitsCompleted, 0);
    const completionRate =
      totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Mark as completed or failed (threshold: 80%)
    const status: ChallengeStatus = completionRate >= 80 ? 'COMPLETED' : 'FAILED';

    await prisma.challenge.update({
      where: { id: challenge.id },
      data: {
        status,
        completionRate,
      },
    });
  }

  return expiredChallenges.length;
};
