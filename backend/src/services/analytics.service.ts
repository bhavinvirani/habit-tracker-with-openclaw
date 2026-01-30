import prisma from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { Habit, HabitLog, Milestone } from '@prisma/client';
import {
  OverviewQuery,
  PeriodQuery,
  HeatmapQuery,
  StreaksQuery,
} from '../validators/analytics.validator';
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

function getTodayDate(): Date {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

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
  const today = getTodayDate();
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
  const endDate = query.endDate ? parseDateString(query.endDate) : getTodayDate();
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
  const endDate = query.endDate ? parseDateString(query.endDate) : getTodayDate();
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
  const today = getTodayDate();
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

  const today = getTodayDate();
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
): Promise<StreakLeader[]> {
  const limit = query.limit || 10;

  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { currentStreak: 'desc' },
    take: limit,
  });

  return habits.map((h) => ({
    habitId: h.id,
    habitName: h.name,
    color: h.color,
    icon: h.icon,
    currentStreak: h.currentStreak,
    longestStreak: h.longestStreak,
    isActive: h.isActive && !h.isArchived,
  }));
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
  const today = getTodayDate();
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
