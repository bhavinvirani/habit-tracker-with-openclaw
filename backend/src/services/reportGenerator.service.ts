import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { generateInsights, AIInsightsResult, HabitDataContext } from './ai.service';
import { featureFlagService } from './featureFlag.service';
import * as analyticsService from './analytics.service';
import logger from '../utils/logger';
import { BadRequestError } from '../utils/AppError';
import { subDays } from 'date-fns';

interface GenerationResult {
  usersProcessed: number;
  usersSkipped: number;
  errors: string[];
}

async function collectUserData(userId: string): Promise<HabitDataContext | null> {
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Fetch user's active habits
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
    select: {
      id: true,
      name: true,
      category: true,
      frequency: true,
      currentStreak: true,
      longestStreak: true,
      totalCompletions: true,
    },
  });

  if (habits.length === 0) return null;

  // Fetch recent habit logs
  const logs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    select: { habitId: true, date: true, completed: true, value: true },
    orderBy: { date: 'desc' },
  });

  // Build per-habit completion data
  const habitData = habits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habitId === habit.id);
    const completedCount = habitLogs.filter((l) => l.completed).length;
    const completionRate = habitLogs.length > 0 ? (completedCount / 30) * 100 : 0;

    return {
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCompletions: habit.totalCompletions,
      completionRate: Math.round(completionRate * 10) / 10,
      recentCompletions: habitLogs.slice(0, 14).map((l) => ({
        date: l.date.toISOString().split('T')[0],
        completed: l.completed,
        value: l.value,
      })),
    };
  });

  // Fetch existing analytics data (reuse analytics service)
  let correlations: HabitDataContext['correlations'] = [];
  try {
    const corrData = await analyticsService.getHabitCorrelations(userId);
    correlations = corrData.correlations.map((c) => ({
      habit1: c.habit1.name,
      habit2: c.habit2.name,
      coefficient: c.correlation,
      interpretation: c.interpretation,
    }));
  } catch {
    // Correlations may not be available for new users
  }

  let dayOfWeekPerformance: HabitDataContext['dayOfWeekPerformance'] = [];
  try {
    const perfData = await analyticsService.getBestPerformingAnalysis(userId);
    dayOfWeekPerformance = perfData.byDayOfWeek.map((d) => ({
      day: d.day,
      completionRate: d.completionRate,
    }));
  } catch {
    // May not be available
  }

  let weekOverWeek: HabitDataContext['weekOverWeek'] = {
    thisWeekRate: 0,
    lastWeekRate: 0,
    change: 0,
  };
  try {
    const compData = await analyticsService.getWeekComparison(userId);
    weekOverWeek = {
      thisWeekRate: compData.thisWeek.rate,
      lastWeekRate: compData.lastWeek.rate,
      change: compData.change,
    };
  } catch {
    // May not be available
  }

  let productivityScore: HabitDataContext['productivityScore'] = {
    score: 0,
    grade: 'N/A',
    trend: 'stable',
  };
  try {
    const prodData = await analyticsService.getProductivityScore(userId);
    productivityScore = {
      score: prodData.score,
      grade: prodData.grade,
      trend: prodData.trend,
    };
  } catch {
    // May not be available
  }

  return {
    habits: habitData,
    correlations,
    dayOfWeekPerformance,
    weekOverWeek,
    productivityScore,
  };
}

export async function generateReportsForAllUsers(): Promise<GenerationResult> {
  const aiEnabled = await featureFlagService.isEnabled('ai_insights');
  if (!aiEnabled) {
    throw new BadRequestError('AI Insights feature is disabled');
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true },
  });

  const result: GenerationResult = {
    usersProcessed: 0,
    usersSkipped: 0,
    errors: [],
  };

  const periodEnd = new Date();
  const periodStart = subDays(periodEnd, 7);

  for (const user of allUsers) {
    try {
      const data = await collectUserData(user.id);
      if (!data) {
        result.usersSkipped++;
        continue;
      }

      const insights: AIInsightsResult = await generateInsights(data);

      await prisma.weeklyReport.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          patterns: insights.patterns as unknown as Prisma.InputJsonValue,
          risks: insights.risks as unknown as Prisma.InputJsonValue,
          optimizations: insights.optimizations as unknown as Prisma.InputJsonValue,
          narrative: insights.narrative,
          periodStart,
          periodEnd,
        },
        update: {
          patterns: insights.patterns as unknown as Prisma.InputJsonValue,
          risks: insights.risks as unknown as Prisma.InputJsonValue,
          optimizations: insights.optimizations as unknown as Prisma.InputJsonValue,
          narrative: insights.narrative,
          periodStart,
          periodEnd,
          generatedAt: new Date(),
        },
      });

      result.usersProcessed++;
      logger.info(`Generated report for user: ${user.name} (${user.id})`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`User ${user.id}: ${errMsg}`);
      logger.error(`Failed to generate report for user ${user.id}`, { error: errMsg });
    }
  }

  logger.info('Report generation complete', result);
  return result;
}

export async function getLatestReport(userId: string) {
  return prisma.weeklyReport.findUnique({
    where: { userId },
  });
}
