import { Habit, HabitWithStats, FeatureFlag, WeeklyStats } from '../../types';
import { TodayHabit, TodayResponse } from '../../services/habits';

let idCounter = 1;

function nextId(prefix = 'id') {
  return `${prefix}-${idCounter++}`;
}

/** Reset the auto-incrementing ID counter between tests */
export function resetIdCounter() {
  idCounter = 1;
}

export function buildHabit(overrides: Partial<Habit> = {}): Habit {
  const id = nextId('habit');
  return {
    id,
    userId: 'user-1',
    name: `Habit ${id}`,
    frequency: 'DAILY',
    color: '#2aa3ff',
    goal: 1,
    isActive: true,
    isArchived: false,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildHabitWithStats(overrides: Partial<HabitWithStats> = {}): HabitWithStats {
  return {
    ...buildHabit(),
    currentStreak: 5,
    longestStreak: 12,
    completionRate: 85,
    totalCompletions: 42,
    ...overrides,
  };
}

export function buildTodayHabit(overrides: Partial<TodayHabit> = {}): TodayHabit {
  const habit = buildHabit();
  return {
    ...habit,
    isCompleted: false,
    logValue: null,
    logNotes: null,
    logId: null,
    currentStreak: 3,
    longestStreak: 10,
    targetValue: null,
    unit: null,
    habitType: 'BOOLEAN',
    ...overrides,
  };
}

export function buildTodayResponse(
  habits: TodayHabit[] = [],
  overrides: Partial<TodayResponse> = {}
): TodayResponse {
  const completed = habits.filter((h) => h.isCompleted).length;
  return {
    date: new Date().toISOString().split('T')[0],
    habits,
    summary: {
      total: habits.length,
      completed,
      remaining: habits.length - completed,
    },
    ...overrides,
  };
}

export function buildFeatureFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  const key = overrides.key || `flag_${nextId('flag')}`;
  return {
    id: overrides.id || `flag-id-${key}`,
    key,
    name: `Feature ${key}`,
    description: `Description for ${key}`,
    category: 'general',
    enabled: false,
    metadata: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildWeeklyStats(overrides: Partial<WeeklyStats> = {}): WeeklyStats {
  return {
    days: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      completed: 2,
      total: 4,
      percentage: 50,
      habits: [],
    })),
    summary: { total: 28, completed: 14, rate: 50 },
    ...overrides,
  };
}
