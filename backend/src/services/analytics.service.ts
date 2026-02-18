import prisma from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { Habit, HabitLog, Milestone } from '@prisma/client';
import {
  OverviewQuery,
  PeriodQuery,
  HeatmapQuery,
  StreaksQuery,
  PaginatedQuery,
} from '../validators/analytics.validator';
import { getUserTimezone, getTodayForTimezone } from '../utils/timezone';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  getDay,
  isAfter,
  differenceInDays,
} from 'date-fns';

// ============ TYPES ============

export interface OverviewStats {
  totalHabits: number;
  activeHabits: number;
  archivedHabits: number;
  completedToday: number;
  totalToday: number;
  todayPercentage: number;
  currentBestStreak: number;
  longestEverStreak: number;
  totalCompletions: number;
  weeklyAverage: number;
  monthlyCompletionRate: number;
}

export interface WeeklyProgress {
  day: string;
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface DailyBreakdown {
  date: string;
  completed: number;
  total: number;
  percentage: number;
  habits: { id: string; name: string; completed: boolean; value: number | null }[];
}

export interface HabitStats {
  habit: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    category: string | null;
    habitType: string;
    targetValue: number | null;
    unit: string | null;
    frequency: string;
  };
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  averageValue: number | null;
  lastCompletedAt: Date | null;
  recentLogs: { date: string; completed: boolean; value: number | null }[];
  weeklyTrend: { week: string; count: number; percentage: number }[];
  milestones: Milestone[];
}

export interface HeatmapDay {
  date: string;
  count: number;
  total: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub-style levels
}

export interface StreakLeader {
  habitId: string;
  habitName: string;
  color: string;
  icon: string | null;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
}

// ============ HELPER FUNCTIONS ============

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function getLevel(percentage: number): 0 | 1 | 2 | 3 | 4 {
  if (percentage === 0) return 0;
  if (percentage < 25) return 1;
  if (percentage < 50) return 2;
  if (percentage < 75) return 3;
  return 4;
}

function shouldTrackOnDate(habit: Habit, date: Date): boolean {
  if (habit.frequency === 'DAILY') return true;
  if (habit.frequency === 'WEEKLY') {
    if (habit.daysOfWeek && habit.daysOfWeek.length > 0) {
      const dayOfWeek = date.getUTCDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      return habit.daysOfWeek.includes(adjustedDay);
    }
    return true;
  }
  return true;
}

// ============ SERVICE FUNCTIONS ============

/**
 * Get overview analytics
 */
export async function getOverview(
  userId: string,
  _query: OverviewQuery
): Promise<{
  stats: OverviewStats;
  weeklyProgress: WeeklyProgress[];
}> {
  const timezone = await getUserTimezone(userId);
  const today = getTodayForTimezone(timezone);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const monthStart = startOfMonth(today);

  // Get all habits
  const habits = await prisma.habit.findMany({
    where: { userId },
  });

  const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);
  const archivedHabits = habits.filter((h) => h.isArchived);

  // Get today's trackable habits
  const todayHabits = activeHabits.filter((h) => shouldTrackOnDate(h, today));

  // Get today's logs
  const todayLogs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: today,
      completed: true,
    },
  });

  // Get this week's logs
  const weekLogs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: weekStart, lte: today },
      completed: true,
    },
  });

  // Get this month's logs
  const monthLogs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: monthStart, lte: today },
      completed: true,
    },
  });

  // Calculate stats
  const currentBestStreak = Math.max(...activeHabits.map((h) => h.currentStreak), 0);
  const longestEverStreak = Math.max(...habits.map((h) => h.longestStreak), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);

  // Weekly average (completions per day this week)
  const daysThisWeek = differenceInDays(today, weekStart) + 1;
  const weeklyAverage =
    daysThisWeek > 0 ? Math.round((weekLogs.length / daysThisWeek) * 10) / 10 : 0;

  // Monthly completion rate
  const daysThisMonth = differenceInDays(today, monthStart) + 1;
  let monthlyExpected = 0;
  for (let i = 0; i < daysThisMonth; i++) {
    const checkDate = subDays(today, i);
    monthlyExpected += activeHabits.filter((h) => {
      if (isAfter(h.createdAt, checkDate)) return false;
      return shouldTrackOnDate(h, checkDate);
    }).length;
  }
  const monthlyCompletionRate =
    monthlyExpected > 0 ? Math.round((monthLogs.length / monthlyExpected) * 100) : 0;

  // Weekly progress (last 7 days)
  const weekDays = eachDayOfInterval({ start: weekStart, end: today });
  const weeklyProgress: WeeklyProgress[] = weekDays.map((day) => {
    const dayLogs = weekLogs.filter((l) => formatDate(l.date) === formatDate(day));
    const dayHabits = activeHabits.filter((h) => {
      if (isAfter(h.createdAt, day)) return false;
      return shouldTrackOnDate(h, day);
    });
    const total = dayHabits.length;
    const completed = dayLogs.length;

    return {
      day: format(day, 'EEE'),
      date: formatDate(day),
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const stats: OverviewStats = {
    totalHabits: habits.length,
    activeHabits: activeHabits.length,
    archivedHabits: archivedHabits.length,
    completedToday: todayLogs.length,
    totalToday: todayHabits.length,
    todayPercentage:
      todayHabits.length > 0 ? Math.round((todayLogs.length / todayHabits.length) * 100) : 0,
    currentBestStreak,
    longestEverStreak,
    totalCompletions,
    weeklyAverage,
    monthlyCompletionRate,
  };

  return { stats, weeklyProgress };
}

/**
 * Get weekly analytics
 */
export async function getWeeklyAnalytics(
  userId: string,
  query: PeriodQuery
): Promise<{
  days: DailyBreakdown[];
  summary: { total: number; completed: number; rate: number };
}> {
  const endDate = query.endDate
    ? parseDateString(query.endDate)
    : getTodayForTimezone(await getUserTimezone(userId));
  const startDate = query.startDate
    ? parseDateString(query.startDate)
    : startOfWeek(endDate, { weekStartsOn: 1 });

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
    select: { id: true, name: true, createdAt: true, frequency: true, daysOfWeek: true },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    include: { habit: { select: { name: true } } },
  });

  const logsByDate = new Map<string, HabitLog[]>();
  for (const log of logs) {
    const dateKey = formatDate(log.date);
    if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, []);
    logsByDate.get(dateKey)!.push(log);
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dailyBreakdown: DailyBreakdown[] = days.map((day) => {
    const dateKey = formatDate(day);
    const dayLogs = logsByDate.get(dateKey) || [];
    const dayHabits = habits.filter((h) => {
      if (isAfter(h.createdAt, day)) return false;
      return shouldTrackOnDate(h as unknown as Habit, day);
    });

    return {
      date: dateKey,
      completed: dayLogs.filter((l) => l.completed).length,
      total: dayHabits.length,
      percentage:
        dayHabits.length > 0
          ? Math.round((dayLogs.filter((l) => l.completed).length / dayHabits.length) * 100)
          : 0,
      habits: dayHabits.map((h) => {
        const log = dayLogs.find((l) => l.habitId === h.id);
        return {
          id: h.id,
          name: h.name,
          completed: log?.completed ?? false,
          value: log?.value ?? null,
        };
      }),
    };
  });

  const totalExpected = dailyBreakdown.reduce((sum, d) => sum + d.total, 0);
  const totalCompleted = dailyBreakdown.reduce((sum, d) => sum + d.completed, 0);

  return {
    days: dailyBreakdown,
    summary: {
      total: totalExpected,
      completed: totalCompleted,
      rate: totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0,
    },
  };
}

/**
 * Get monthly analytics
 */
export async function getMonthlyAnalytics(
  userId: string,
  query: PeriodQuery
): Promise<{
  weeks: { weekStart: string; weekEnd: string; completed: number; total: number; rate: number }[];
  summary: { total: number; completed: number; rate: number };
}> {
  const endDate = query.endDate
    ? parseDateString(query.endDate)
    : getTodayForTimezone(await getUserTimezone(userId));
  const startDate = query.startDate ? parseDateString(query.startDate) : startOfMonth(endDate);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      completed: true,
    },
  });

  const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
  const weeklyData = weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const actualEnd = isAfter(weekEnd, endDate) ? endDate : weekEnd;

    const weekDays = eachDayOfInterval({ start: weekStart, end: actualEnd });
    let totalExpected = 0;
    let totalCompleted = 0;

    for (const day of weekDays) {
      const dayHabits = habits.filter((h) => {
        if (isAfter(h.createdAt, day)) return false;
        return shouldTrackOnDate(h, day);
      });
      totalExpected += dayHabits.length;
      totalCompleted += logs.filter((l) => formatDate(l.date) === formatDate(day)).length;
    }

    return {
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(actualEnd),
      completed: totalCompleted,
      total: totalExpected,
      rate: totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0,
    };
  });

  const totalExpected = weeklyData.reduce((sum, w) => sum + w.total, 0);
  const totalCompleted = weeklyData.reduce((sum, w) => sum + w.completed, 0);

  return {
    weeks: weeklyData,
    summary: {
      total: totalExpected,
      completed: totalCompleted,
      rate: totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0,
    },
  };
}

/**
 * Get heatmap data for a year
 */
export async function getHeatmap(userId: string, query: HeatmapQuery): Promise<HeatmapDay[]> {
  const year = query.year || new Date().getFullYear();
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31));
  const today = getTodayForTimezone(await getUserTimezone(userId));
  const actualEnd = isAfter(endDate, today) ? today : endDate;

  const habits = await prisma.habit.findMany({
    where: {
      userId,
      ...(query.habitId && { id: query.habitId }),
    },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: actualEnd },
      completed: true,
      ...(query.habitId && { habitId: query.habitId }),
    },
  });

  const logsByDate = new Map<string, number>();
  for (const log of logs) {
    const dateKey = formatDate(log.date);
    logsByDate.set(dateKey, (logsByDate.get(dateKey) || 0) + 1);
  }

  const days = eachDayOfInterval({ start: startDate, end: actualEnd });
  return days.map((day) => {
    const dateKey = formatDate(day);
    const count = logsByDate.get(dateKey) || 0;

    const trackableHabits = habits.filter((h) => {
      if (isAfter(h.createdAt, day)) return false;
      if (!h.isActive && !h.isArchived) return false;
      return shouldTrackOnDate(h, day);
    });

    const total = query.habitId ? 1 : trackableHabits.length;
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return {
      date: dateKey,
      count,
      total,
      level: getLevel(percentage),
    };
  });
}

/**
 * Get stats for a specific habit
 */
export async function getHabitStats(userId: string, habitId: string): Promise<HabitStats> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new NotFoundError('Habit', habitId);
  }

  const today = getTodayForTimezone(await getUserTimezone(userId));
  const thirtyDaysAgo = subDays(today, 30);

  // Get logs for the last 30 days
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId,
      date: { gte: thirtyDaysAgo, lte: today },
    },
    orderBy: { date: 'desc' },
  });

  // Calculate completion rate for last 30 days
  let expectedDays = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = subDays(today, i);
    if (isAfter(habit.createdAt, checkDate)) continue;
    if (shouldTrackOnDate(habit, checkDate)) expectedDays++;
  }

  const completedDays = logs.filter((l) => l.completed).length;
  const completionRate = expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0;

  // Calculate average value (for NUMERIC/DURATION habits)
  let averageValue: number | null = null;
  if (habit.habitType !== 'BOOLEAN') {
    const valuesWithData = logs.filter((l) => l.value !== null).map((l) => l.value!);
    if (valuesWithData.length > 0) {
      averageValue = Math.round(valuesWithData.reduce((a, b) => a + b, 0) / valuesWithData.length);
    }
  }

  // Get weekly trend (last 8 weeks)
  const eightWeeksAgo = subWeeks(today, 8);
  const weeklyLogs = await prisma.habitLog.findMany({
    where: {
      habitId,
      date: { gte: eightWeeksAgo, lte: today },
      completed: true,
    },
  });

  const weeks = eachWeekOfInterval({ start: eightWeeksAgo, end: today }, { weekStartsOn: 1 });
  const weeklyTrend = weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const actualEnd = isAfter(weekEnd, today) ? today : weekEnd;
    const weekDays = eachDayOfInterval({ start: weekStart, end: actualEnd });

    let expected = 0;
    let completed = 0;

    for (const day of weekDays) {
      if (isAfter(habit.createdAt, day)) continue;
      if (shouldTrackOnDate(habit, day)) {
        expected++;
        if (weeklyLogs.some((l) => formatDate(l.date) === formatDate(day))) {
          completed++;
        }
      }
    }

    return {
      week: formatDate(weekStart),
      count: completed,
      percentage: expected > 0 ? Math.round((completed / expected) * 100) : 0,
    };
  });

  // Get milestones
  const milestones = await prisma.milestone.findMany({
    where: { habitId },
    orderBy: { achievedAt: 'desc' },
  });

  // Recent logs (last 10)
  const recentLogs = logs.slice(0, 10).map((l) => ({
    date: formatDate(l.date),
    completed: l.completed,
    value: l.value,
  }));

  return {
    habit: {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      color: habit.color,
      icon: habit.icon,
      category: habit.category,
      habitType: habit.habitType,
      targetValue: habit.targetValue,
      unit: habit.unit,
      frequency: habit.frequency,
    },
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    totalCompletions: habit.totalCompletions,
    completionRate,
    averageValue,
    lastCompletedAt: habit.lastCompletedAt,
    recentLogs,
    weeklyTrend,
    milestones,
  };
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(
  userId: string,
  query: StreaksQuery
): Promise<{ streaks: StreakLeader[]; total: number }> {
  const limit = query.limit || 10;
  const offset = query.offset || 0;

  const [habits, total] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      orderBy: { currentStreak: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.habit.count({ where: { userId } }),
  ]);

  const streaks = habits.map((h) => ({
    habitId: h.id,
    habitName: h.name,
    color: h.color,
    icon: h.icon,
    currentStreak: h.currentStreak,
    longestStreak: h.longestStreak,
    isActive: h.isActive && !h.isArchived,
  }));

  return { streaks, total };
}

/**
 * Get insights and suggestions
 */
export async function getInsights(userId: string): Promise<{
  bestDay: { day: string; percentage: number } | null;
  worstDay: { day: string; percentage: number } | null;
  topHabit: { name: string; streak: number } | null;
  needsAttention: { name: string; missedDays: number }[];
  suggestions: string[];
}> {
  const today = getTodayForTimezone(await getUserTimezone(userId));
  const fourWeeksAgo = subWeeks(today, 4);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: fourWeeksAgo, lte: today },
      completed: true,
    },
  });

  // Calculate by day of week
  const dayStats: { [key: number]: { completed: number; total: number } } = {};
  for (let i = 1; i <= 7; i++) dayStats[i] = { completed: 0, total: 0 };

  const days = eachDayOfInterval({ start: fourWeeksAgo, end: today });
  for (const day of days) {
    const dayOfWeek = getDay(day) || 7;
    const dayHabits = habits.filter((h) => {
      if (isAfter(h.createdAt, day)) return false;
      return shouldTrackOnDate(h, day);
    });
    dayStats[dayOfWeek].total += dayHabits.length;
    dayStats[dayOfWeek].completed += logs.filter(
      (l) => formatDate(l.date) === formatDate(day)
    ).length;
  }

  const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayPercentages = Object.entries(dayStats).map(([day, stats]) => ({
    day: dayNames[parseInt(day)],
    percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
  }));

  const sortedDays = [...dayPercentages].sort((a, b) => b.percentage - a.percentage);
  const bestDay = sortedDays[0]?.percentage > 0 ? sortedDays[0] : null;
  const worstDay =
    sortedDays[sortedDays.length - 1]?.percentage < 100 ? sortedDays[sortedDays.length - 1] : null;

  // Top habit by streak
  const topHabit =
    habits.length > 0
      ? habits.reduce((best, h) => (h.currentStreak > (best?.currentStreak || 0) ? h : best))
      : null;

  // Habits needing attention (missed in last 3 days)
  const threeDaysAgo = subDays(today, 3);
  const needsAttention = habits
    .filter((h) => {
      if (!h.lastCompletedAt) return true;
      return isAfter(threeDaysAgo, h.lastCompletedAt);
    })
    .map((h) => ({
      name: h.name,
      missedDays: h.lastCompletedAt ? differenceInDays(today, h.lastCompletedAt) : 999,
    }))
    .sort((a, b) => b.missedDays - a.missedDays)
    .slice(0, 3);

  // Generate suggestions
  const suggestions: string[] = [];
  if (bestDay && worstDay && bestDay.percentage - worstDay.percentage > 20) {
    suggestions.push(
      `You perform best on ${bestDay.day}s (${bestDay.percentage}%). Try to maintain that energy on ${worstDay.day}s too!`
    );
  }
  if (topHabit && topHabit.currentStreak >= 7) {
    suggestions.push(
      `Great job on "${topHabit.name}"! You have a ${topHabit.currentStreak}-day streak going!`
    );
  }
  if (needsAttention.length > 0) {
    suggestions.push(
      `"${needsAttention[0].name}" needs your attention. It's been ${needsAttention[0].missedDays} days since your last completion.`
    );
  }
  if (habits.length === 0) {
    suggestions.push('Start your habit journey by creating your first habit!');
  }

  return {
    bestDay,
    worstDay,
    topHabit: topHabit ? { name: topHabit.name, streak: topHabit.currentStreak } : null,
    needsAttention,
    suggestions,
  };
}

/**
 * Get category breakdown stats
 */
export async function getCategoryBreakdown(userId: string): Promise<{
  categories: Array<{
    name: string;
    color: string;
    habitCount: number;
    completionRate: number;
    totalCompletions: number;
  }>;
  habitRates: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    category: string | null;
    completionRate: number;
    currentStreak: number;
  }>;
}> {
  const today = getTodayForTimezone(await getUserTimezone(userId));
  const thirtyDaysAgo = subDays(today, 30);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
    include: {
      habitLogs: {
        where: {
          date: { gte: thirtyDaysAgo, lte: today },
          completed: true,
        },
      },
    },
  });

  // Calculate expected completions and actual for each habit
  const habitStats = habits.map((habit) => {
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    let expectedDays = 0;

    for (const day of days) {
      if (!isAfter(habit.createdAt, day) && shouldTrackOnDate(habit, day)) {
        expectedDays++;
      }
    }

    const completedDays = habit.habitLogs.length;
    const completionRate = expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0;

    return {
      id: habit.id,
      name: habit.name,
      color: habit.color,
      icon: habit.icon,
      category: habit.category || 'Uncategorized',
      completionRate,
      currentStreak: habit.currentStreak,
      completedDays,
      expectedDays,
    };
  });

  // Group by category
  const categoryMap = new Map<
    string,
    { color: string; completedDays: number; expectedDays: number; count: number }
  >();

  // Category colors
  const categoryColors: Record<string, string> = {
    Fitness: '#10b981',
    Health: '#3b82f6',
    Learning: '#f59e0b',
    Mindfulness: '#8b5cf6',
    Productivity: '#ef4444',
    Uncategorized: '#64748b',
  };

  for (const stat of habitStats) {
    const existing = categoryMap.get(stat.category) || {
      color: categoryColors[stat.category] || '#64748b',
      completedDays: 0,
      expectedDays: 0,
      count: 0,
    };
    existing.completedDays += stat.completedDays;
    existing.expectedDays += stat.expectedDays;
    existing.count++;
    categoryMap.set(stat.category, existing);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    color: data.color,
    habitCount: data.count,
    completionRate:
      data.expectedDays > 0 ? Math.round((data.completedDays / data.expectedDays) * 100) : 0,
    totalCompletions: data.completedDays,
  }));

  return {
    categories: categories.sort((a, b) => b.completionRate - a.completionRate),
    habitRates: habitStats
      .map((h) => ({
        id: h.id,
        name: h.name,
        color: h.color,
        icon: h.icon,
        category: h.category,
        completionRate: h.completionRate,
        currentStreak: h.currentStreak,
      }))
      .sort((a, b) => b.completionRate - a.completionRate),
  };
}

/**
 * Get week-over-week comparison
 */
export async function getWeekComparison(userId: string): Promise<{
  thisWeek: { completed: number; total: number; rate: number };
  lastWeek: { completed: number; total: number; rate: number };
  change: number;
  trend: 'up' | 'down' | 'same';
}> {
  const today = getTodayForTimezone(await getUserTimezone(userId));
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const lastWeekEnd = subDays(thisWeekStart, 1);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
  });

  const thisWeekLogs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: thisWeekStart, lte: today },
      completed: true,
    },
  });

  const lastWeekLogs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: lastWeekStart, lte: lastWeekEnd },
      completed: true,
    },
  });

  // Calculate this week
  const thisWeekDays = eachDayOfInterval({ start: thisWeekStart, end: today });
  let thisWeekTotal = 0;
  for (const day of thisWeekDays) {
    thisWeekTotal += habits.filter(
      (h) => !isAfter(h.createdAt, day) && shouldTrackOnDate(h, day)
    ).length;
  }
  const thisWeekCompleted = thisWeekLogs.length;
  const thisWeekRate =
    thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;

  // Calculate last week
  const lastWeekDays = eachDayOfInterval({ start: lastWeekStart, end: lastWeekEnd });
  let lastWeekTotal = 0;
  for (const day of lastWeekDays) {
    lastWeekTotal += habits.filter(
      (h) => !isAfter(h.createdAt, day) && shouldTrackOnDate(h, day)
    ).length;
  }
  const lastWeekCompleted = lastWeekLogs.length;
  const lastWeekRate =
    lastWeekTotal > 0 ? Math.round((lastWeekCompleted / lastWeekTotal) * 100) : 0;

  const change = thisWeekRate - lastWeekRate;

  return {
    thisWeek: { completed: thisWeekCompleted, total: thisWeekTotal, rate: thisWeekRate },
    lastWeek: { completed: lastWeekCompleted, total: lastWeekTotal, rate: lastWeekRate },
    change,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
  };
}

/**
 * Get monthly trend data (last 30 days)
 */
export async function getMonthlyTrend(userId: string): Promise<{
  days: Array<{ date: string; rate: number; completed: number; total: number }>;
  averageRate: number;
}> {
  const today = getTodayForTimezone(await getUserTimezone(userId));
  const thirtyDaysAgo = subDays(today, 29);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo, lte: today },
      completed: true,
    },
  });

  const logsByDate = new Map<string, number>();
  for (const log of logs) {
    const dateKey = formatDate(log.date);
    logsByDate.set(dateKey, (logsByDate.get(dateKey) || 0) + 1);
  }

  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
  let totalRate = 0;
  let daysWithData = 0;

  const trendData = days.map((day) => {
    const dateKey = formatDate(day);
    const dayHabits = habits.filter((h) => !isAfter(h.createdAt, day) && shouldTrackOnDate(h, day));
    const total = dayHabits.length;
    const completed = logsByDate.get(dateKey) || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (total > 0) {
      totalRate += rate;
      daysWithData++;
    }

    return { date: dateKey, rate, completed, total };
  });

  return {
    days: trendData,
    averageRate: daysWithData > 0 ? Math.round(totalRate / daysWithData) : 0,
  };
}

/**
 * Get calendar data for a specific month (day-by-day with habit details)
 */
export async function getCalendarData(
  userId: string,
  year: number,
  month: number
): Promise<{
  days: DailyBreakdown[];
  summary: { totalCompleted: number; totalPossible: number; percentage: number };
}> {
  // Month is 1-indexed (1 = January)
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0)); // Last day of month
  const today = getTodayForTimezone(await getUserTimezone(userId));
  const actualEnd = isAfter(endDate, today) ? today : endDate;

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      createdAt: true,
      frequency: true,
      daysOfWeek: true,
    },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: actualEnd },
    },
  });

  const logsByDate = new Map<string, typeof logs>();
  for (const log of logs) {
    const dateKey = formatDate(log.date);
    if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, []);
    logsByDate.get(dateKey)!.push(log);
  }

  const days = eachDayOfInterval({ start: startDate, end: actualEnd });
  const dailyData: DailyBreakdown[] = days.map((day) => {
    const dateKey = formatDate(day);
    const dayLogs = logsByDate.get(dateKey) || [];

    const dayHabits = habits.filter((h) => {
      if (isAfter(h.createdAt, day)) return false;
      return shouldTrackOnDate(h as unknown as Habit, day);
    });

    const completedCount = dayLogs.filter((l) => l.completed).length;

    return {
      date: dateKey,
      completed: completedCount,
      total: dayHabits.length,
      percentage: dayHabits.length > 0 ? Math.round((completedCount / dayHabits.length) * 100) : 0,
      habits: dayHabits.map((h) => {
        const log = dayLogs.find((l) => l.habitId === h.id);
        return {
          id: h.id,
          name: h.name,
          color: h.color,
          icon: h.icon,
          completed: log?.completed ?? false,
          value: log?.value ?? null,
        };
      }),
    };
  });

  const totalCompleted = dailyData.reduce((sum, d) => sum + d.completed, 0);
  const totalPossible = dailyData.reduce((sum, d) => sum + d.total, 0);

  return {
    days: dailyData,
    summary: {
      totalCompleted,
      totalPossible,
      percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    },
  };
}

// ============ ADVANCED ANALYTICS ============

export interface ProductivityScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'improving' | 'stable' | 'declining';
  breakdown: {
    consistency: number; // 0-40 points
    streaks: number; // 0-30 points
    completion: number; // 0-30 points
  };
}

export interface BestPerformingAnalysis {
  bestDayOfWeek: { day: string; dayNumber: number; completionRate: number };
  worstDayOfWeek: { day: string; dayNumber: number; completionRate: number };
  byDayOfWeek: { day: string; dayNumber: number; completionRate: number; completions: number }[];
  mostConsistentHabit: { id: string; name: string; color: string; rate: number } | null;
  leastConsistentHabit: { id: string; name: string; color: string; rate: number } | null;
}

export interface HabitCorrelation {
  habit1: { id: string; name: string };
  habit2: { id: string; name: string };
  correlation: number; // -1 to 1
  interpretation: string;
}

export interface StreakPrediction {
  habitId: string;
  habitName: string;
  currentStreak: number;
  predictedDaysToMilestone: number;
  nextMilestone: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskReason: string | null;
}

/**
 * Calculate productivity score based on multiple factors
 */
export async function getProductivityScore(userId: string): Promise<ProductivityScore> {
  const timezone = await getUserTimezone(userId);
  const today = getTodayForTimezone(timezone);
  const thirtyDaysAgo = subDays(today, 30);
  const sixtyDaysAgo = subDays(today, 60);

  // Get habits and logs
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
  });

  const recentLogs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: thirtyDaysAgo, lte: today }, completed: true },
  });

  const olderLogs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, completed: true },
  });

  // Calculate consistency (0-40): How many days had at least one completion
  const uniqueDays = new Set(recentLogs.map((l) => formatDate(l.date)));
  const daysWithActivity = uniqueDays.size;
  const consistency = Math.min(40, Math.round((daysWithActivity / 30) * 40));

  // Calculate streaks score (0-30): Based on current active streaks
  const maxStreak = Math.max(...habits.map((h) => h.currentStreak), 0);
  const avgStreak =
    habits.length > 0 ? habits.reduce((sum, h) => sum + h.currentStreak, 0) / habits.length : 0;
  const streaks = Math.min(30, Math.round((maxStreak * 0.5 + avgStreak * 0.5) * 2));

  // Calculate completion rate (0-30): Overall completion rate last 30 days
  let totalExpected = 0;
  for (let i = 0; i < 30; i++) {
    const day = subDays(today, i);
    totalExpected += habits.filter(
      (h) => !isAfter(h.createdAt, day) && shouldTrackOnDate(h, day)
    ).length;
  }
  const completionRate = totalExpected > 0 ? recentLogs.length / totalExpected : 0;
  const completion = Math.min(30, Math.round(completionRate * 30));

  const score = consistency + streaks + completion;

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  // Determine trend
  const recentRate = totalExpected > 0 ? recentLogs.length / totalExpected : 0;
  let olderExpected = 0;
  for (let i = 30; i < 60; i++) {
    const day = subDays(today, i);
    olderExpected += habits.filter(
      (h) => !isAfter(h.createdAt, day) && shouldTrackOnDate(h, day)
    ).length;
  }
  const olderRate = olderExpected > 0 ? olderLogs.length / olderExpected : 0;

  let trend: 'improving' | 'stable' | 'declining';
  if (recentRate > olderRate + 0.1) trend = 'improving';
  else if (recentRate < olderRate - 0.1) trend = 'declining';
  else trend = 'stable';

  return {
    score,
    grade,
    trend,
    breakdown: { consistency, streaks, completion },
  };
}

/**
 * Analyze best performing days and habits
 */
export async function getBestPerformingAnalysis(userId: string): Promise<BestPerformingAnalysis> {
  const timezone = await getUserTimezone(userId);
  const today = getTodayForTimezone(timezone);
  const thirtyDaysAgo = subDays(today, 30);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
  });

  const logs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: thirtyDaysAgo, lte: today }, completed: true },
  });

  // Analyze by day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = Array.from({ length: 7 }, () => ({ completions: 0, expected: 0 }));

  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
  for (const day of days) {
    const dayOfWeek = getDay(day);
    const dayHabits = habits.filter((h) => !isAfter(h.createdAt, day) && shouldTrackOnDate(h, day));
    const dayLogs = logs.filter((l) => formatDate(l.date) === formatDate(day));

    dayStats[dayOfWeek].expected += dayHabits.length;
    dayStats[dayOfWeek].completions += dayLogs.length;
  }

  const byDayOfWeek = dayStats.map((stat, i) => ({
    day: dayNames[i],
    dayNumber: i,
    completionRate: stat.expected > 0 ? Math.round((stat.completions / stat.expected) * 100) : 0,
    completions: stat.completions,
  }));

  const sorted = [...byDayOfWeek].sort((a, b) => b.completionRate - a.completionRate);
  const bestDayOfWeek = sorted[0];
  const worstDayOfWeek = sorted[sorted.length - 1];

  // Find most/least consistent habits
  const habitStats = habits.map((h) => {
    const habitLogs = logs.filter((l) => l.habitId === h.id);
    let expected = 0;
    for (const day of days) {
      if (!isAfter(h.createdAt, day) && shouldTrackOnDate(h, day)) {
        expected++;
      }
    }
    return {
      id: h.id,
      name: h.name,
      color: h.color,
      rate: expected > 0 ? Math.round((habitLogs.length / expected) * 100) : 0,
    };
  });

  const sortedHabits = [...habitStats].sort((a, b) => b.rate - a.rate);
  const mostConsistentHabit = sortedHabits.length > 0 ? sortedHabits[0] : null;
  const leastConsistentHabit =
    sortedHabits.length > 0 ? sortedHabits[sortedHabits.length - 1] : null;

  return {
    bestDayOfWeek,
    worstDayOfWeek,
    byDayOfWeek,
    mostConsistentHabit,
    leastConsistentHabit,
  };
}

/**
 * Find habit correlations (which habits tend to be completed together)
 */
export async function getHabitCorrelations(
  userId: string,
  query?: PaginatedQuery
): Promise<{ correlations: HabitCorrelation[]; total: number }> {
  const timezone = await getUserTimezone(userId);
  const today = getTodayForTimezone(timezone);
  const thirtyDaysAgo = subDays(today, 30);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
    take: 10, // Limit to prevent expensive calculations
    orderBy: { totalCompletions: 'desc' },
  });

  if (habits.length < 2) return { correlations: [], total: 0 };

  const logs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: thirtyDaysAgo, lte: today }, completed: true },
  });

  // Group logs by date
  const logsByDate = new Map<string, Set<string>>();
  for (const log of logs) {
    const dateKey = formatDate(log.date);
    if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, new Set());
    logsByDate.get(dateKey)!.add(log.habitId);
  }

  const correlations: HabitCorrelation[] = [];

  // Calculate pairwise correlations
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const h1 = habits[i];
      const h2 = habits[j];

      let bothDone = 0;
      let onlyFirst = 0;
      let onlySecond = 0;
      let neitherDone = 0;

      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
      for (const day of days) {
        const dateKey = formatDate(day);
        const dayLogs = logsByDate.get(dateKey) || new Set();

        const h1Done = dayLogs.has(h1.id);
        const h2Done = dayLogs.has(h2.id);

        if (h1Done && h2Done) bothDone++;
        else if (h1Done) onlyFirst++;
        else if (h2Done) onlySecond++;
        else neitherDone++;
      }

      // Calculate phi coefficient (correlation for binary variables)
      const num = bothDone * neitherDone - onlyFirst * onlySecond;
      const denom = Math.sqrt(
        (bothDone + onlyFirst) *
          (bothDone + onlySecond) *
          (neitherDone + onlyFirst) *
          (neitherDone + onlySecond)
      );
      const correlation = denom > 0 ? Math.round((num / denom) * 100) / 100 : 0;

      let interpretation: string;
      if (correlation > 0.5) interpretation = 'Strong positive - often completed together';
      else if (correlation > 0.2) interpretation = 'Moderate positive - tend to be done together';
      else if (correlation < -0.5) interpretation = 'Strong negative - rarely done on same day';
      else if (correlation < -0.2)
        interpretation = 'Moderate negative - completing one may reduce other';
      else interpretation = 'Weak/no correlation';

      // Only include notable correlations
      if (Math.abs(correlation) >= 0.2) {
        correlations.push({
          habit1: { id: h1.id, name: h1.name },
          habit2: { id: h2.id, name: h2.name },
          correlation,
          interpretation,
        });
      }
    }
  }

  const sorted = correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  const total = sorted.length;
  const limit = query?.limit || 20;
  const offset = query?.offset || 0;

  return { correlations: sorted.slice(offset, offset + limit), total };
}

/**
 * Predict streak milestones and risk assessment
 */
export async function getStreakPredictions(
  userId: string,
  query?: PaginatedQuery
): Promise<{ predictions: StreakPrediction[]; total: number }> {
  const timezone = await getUserTimezone(userId);
  const today = getTodayForTimezone(timezone);
  const sevenDaysAgo = subDays(today, 7);

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false, currentStreak: { gt: 0 } },
  });

  const logs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: sevenDaysAgo, lte: today } },
  });

  const predictions: StreakPrediction[] = [];

  for (const habit of habits) {
    const milestones = [7, 14, 21, 30, 60, 90, 100, 180, 365];
    const nextMilestone =
      milestones.find((m) => m > habit.currentStreak) || habit.currentStreak + 30;
    const daysToMilestone = nextMilestone - habit.currentStreak;

    // Calculate recent activity
    const recentLogs = logs.filter((l) => l.habitId === habit.id);
    const expectedDays = 7;
    const activeDays = recentLogs.filter((l) => l.completed).length;
    const recentRate = activeDays / expectedDays;

    // Determine risk
    let riskLevel: 'low' | 'medium' | 'high';
    let riskReason: string | null = null;

    if (recentRate >= 0.9) {
      riskLevel = 'low';
    } else if (recentRate >= 0.7) {
      riskLevel = 'medium';
      riskReason = 'Missed some days recently';
    } else {
      riskLevel = 'high';
      riskReason = 'Declining activity pattern';
    }

    // Check for missed days in last 3 days
    const lastThreeDays = [0, 1, 2].map((i) => subDays(today, i));
    const missedRecently = lastThreeDays.some((day) => {
      if (!shouldTrackOnDate(habit, day)) return false;
      return !recentLogs.some((l) => formatDate(l.date) === formatDate(day) && l.completed);
    });

    if (missedRecently && riskLevel !== 'high') {
      riskLevel = 'medium';
      riskReason = 'Missed check-in in last 3 days';
    }

    predictions.push({
      habitId: habit.id,
      habitName: habit.name,
      currentStreak: habit.currentStreak,
      predictedDaysToMilestone: daysToMilestone,
      nextMilestone,
      riskLevel,
      riskReason,
    });
  }

  const sorted = predictions.sort(
    (a, b) => a.predictedDaysToMilestone - b.predictedDaysToMilestone
  );
  const total = sorted.length;
  const limit = query?.limit || 20;
  const offset = query?.offset || 0;

  return { predictions: sorted.slice(offset, offset + limit), total };
}
