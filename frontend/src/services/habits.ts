import api from './api';
import { Habit, HabitLog, InsightsData, HabitWithStats, HabitType } from '../types';

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface TodayHabit extends Omit<Habit, 'habitType' | 'targetValue' | 'unit'> {
  isCompleted: boolean;
  logValue: number | null;
  logNotes: string | null;
  logId: string | null;
  currentStreak: number;
  longestStreak: number;
  targetValue: number | null;
  unit: string | null;
  habitType: HabitType | string;
}

export interface TodayResponse {
  date: string;
  habits: TodayHabit[];
  summary: {
    total: number;
    completed: number;
    remaining: number;
  };
}

interface OverviewStats {
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

export interface WeeklyDay {
  date: string;
  completed: number;
  total: number;
  percentage: number;
  habits: Array<{ id: string; name: string; completed: boolean; value: number | null }>;
}

export interface WeeklyStats {
  days: WeeklyDay[];
  summary: {
    total: number;
    completed: number;
    rate: number;
  };
}

interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
  color: string;
  icon: string;
  defaultGoal: number;
  tips: string[];
}

interface Milestone {
  id: string;
  habitId: string;
  type: string;
  value: number;
  achievedAt: string;
  habit: {
    name: string;
    color: string;
    icon?: string;
  };
}

interface MonthlyStats {
  days: Array<{
    date: string;
    completed: number;
    total: number;
    percentage: number;
    habits?: Array<{
      id: string;
      name: string;
      color?: string;
      icon?: string;
      completed: boolean;
      value?: number | null;
    }>;
  }>;
  summary: {
    totalCompleted: number;
    totalPossible: number;
    percentage: number;
  };
}

interface CalendarData {
  days: Array<{
    date: string;
    completed: number;
    total: number;
    percentage: number;
    habits: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
      completed: boolean;
      value: number | null;
    }>;
  }>;
  summary: {
    totalCompleted: number;
    totalPossible: number;
    percentage: number;
  };
}

interface HeatmapStats {
  heatmap: Array<{
    date: string;
    count: number;
    total: number;
    level: number;
  }>;
}

interface HabitAnalyticsStats {
  habitId: string;
  name: string;
  stats: {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    totalCompletions: number;
  };
}

interface StreaksData {
  streaks: Array<{
    habitId: string;
    habitName: string;
    currentStreak: number;
    longestStreak: number;
    color: string;
  }>;
}

interface CategoryBreakdown {
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
}

interface WeekComparison {
  thisWeek: { completed: number; total: number; rate: number };
  lastWeek: { completed: number; total: number; rate: number };
  change: number;
  trend: 'up' | 'down' | 'same';
}

interface MonthlyTrend {
  days: Array<{ date: string; rate: number; completed: number; total: number }>;
  averageRate: number;
}

// Habits API
export const habitsApi = {
  getAll: async (): Promise<HabitWithStats[]> => {
    const response = await api.get<ApiResponse<{ habits: HabitWithStats[] }>>('/habits');
    return response.data.data.habits;
  },

  getArchived: async (): Promise<HabitWithStats[]> => {
    const response =
      await api.get<ApiResponse<{ habits: HabitWithStats[] }>>('/habits?isArchived=true');
    return response.data.data.habits;
  },

  getById: async (id: string): Promise<HabitWithStats> => {
    const response = await api.get<ApiResponse<{ habit: HabitWithStats }>>(`/habits/${id}`);
    return response.data.data.habit;
  },

  create: async (habit: Partial<Habit>): Promise<Habit> => {
    const response = await api.post<ApiResponse<{ habit: Habit }>>('/habits', habit);
    return response.data.data.habit;
  },

  update: async (id: string, habit: Partial<Habit>): Promise<Habit> => {
    const response = await api.patch<ApiResponse<{ habit: Habit }>>(`/habits/${id}`, habit);
    return response.data.data.habit;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/habits/${id}`);
  },

  archive: async (id: string): Promise<Habit> => {
    const response = await api.post<ApiResponse<{ habit: Habit }>>(`/habits/${id}/archive`);
    return response.data.data.habit;
  },

  unarchive: async (id: string): Promise<Habit> => {
    const response = await api.post<ApiResponse<{ habit: Habit }>>(`/habits/${id}/unarchive`);
    return response.data.data.habit;
  },

  reorder: async (habitIds: string[]): Promise<void> => {
    await api.patch('/habits/reorder', { habitIds });
  },

  // Pause/Resume (Vacation Mode)
  pause: async (id: string, pausedUntil?: string, reason?: string): Promise<Habit> => {
    const response = await api.post<ApiResponse<{ habit: Habit }>>(`/habits/${id}/pause`, {
      pausedUntil,
      reason,
    });
    return response.data.data.habit;
  },

  resume: async (id: string): Promise<Habit> => {
    const response = await api.post<ApiResponse<{ habit: Habit }>>(`/habits/${id}/resume`);
    return response.data.data.habit;
  },

  // Habit Stacking
  stack: async (id: string, afterHabitId: string | null): Promise<Habit> => {
    const response = await api.post<ApiResponse<{ habit: Habit }>>(`/habits/${id}/stack`, {
      afterHabitId,
    });
    return response.data.data.habit;
  },
};

// Tracking API
export const trackingApi = {
  getToday: async (): Promise<TodayResponse> => {
    const response = await api.get<ApiResponse<TodayResponse>>('/tracking/today');
    return response.data.data;
  },

  checkIn: async (
    habitId: string,
    data?: { notes?: string; date?: string; value?: number; completed?: boolean }
  ): Promise<HabitLog> => {
    const response = await api.post<ApiResponse<{ log: HabitLog }>>(`/tracking/check-in`, {
      habitId,
      ...data,
    });
    return response.data.data.log;
  },

  undo: async (habitId: string, date?: string): Promise<void> => {
    await api.delete(`/tracking/check-in`, { data: { habitId, date } });
  },

  getHistory: async (habitId: string, days?: number): Promise<HabitLog[]> => {
    const response = await api.get<ApiResponse<{ logs: HabitLog[] }>>(
      `/tracking/habits/${habitId}/history`,
      {
        params: { days },
      }
    );
    return response.data.data.logs;
  },

  getMilestones: async (): Promise<Milestone[]> => {
    const response =
      await api.get<ApiResponse<{ milestones: Milestone[] }>>('/tracking/milestones');
    return response.data.data.milestones;
  },
};

// Analytics API
export const analyticsApi = {
  getOverview: async (): Promise<OverviewStats> => {
    const response = await api.get<ApiResponse<{ stats: OverviewStats }>>('/analytics/overview');
    return response.data.data.stats;
  },

  getWeekly: async (date?: string): Promise<WeeklyStats> => {
    const response = await api.get<ApiResponse<WeeklyStats>>('/analytics/weekly', {
      params: { date },
    });
    return response.data.data;
  },

  getMonthly: async (year?: number, month?: number): Promise<MonthlyStats> => {
    const response = await api.get<ApiResponse<MonthlyStats>>('/analytics/monthly', {
      params: { year, month },
    });
    return response.data.data;
  },

  getCalendar: async (year: number, month: number): Promise<CalendarData> => {
    const response = await api.get<ApiResponse<CalendarData>>('/analytics/calendar', {
      params: { year, month },
    });
    return response.data.data;
  },

  getHeatmap: async (year?: number): Promise<HeatmapStats> => {
    const response = await api.get<ApiResponse<HeatmapStats>>('/analytics/heatmap', {
      params: { year },
    });
    return response.data.data;
  },

  getHabitStats: async (habitId: string): Promise<HabitAnalyticsStats> => {
    const response = await api.get<ApiResponse<HabitAnalyticsStats>>(
      `/analytics/habits/${habitId}`
    );
    return response.data.data;
  },

  getStreaks: async (): Promise<StreaksData> => {
    const response = await api.get<ApiResponse<StreaksData>>('/analytics/streaks');
    return response.data.data;
  },

  getInsights: async (): Promise<InsightsData> => {
    const response = await api.get<ApiResponse<InsightsData>>('/analytics/insights');
    return response.data.data;
  },

  getCategoryBreakdown: async (): Promise<CategoryBreakdown> => {
    const response = await api.get<ApiResponse<CategoryBreakdown>>('/analytics/categories');
    return response.data.data;
  },

  getWeekComparison: async (): Promise<WeekComparison> => {
    const response = await api.get<ApiResponse<WeekComparison>>('/analytics/comparison');
    return response.data.data;
  },

  getMonthlyTrend: async (): Promise<MonthlyTrend> => {
    const response = await api.get<ApiResponse<MonthlyTrend>>('/analytics/trend');
    return response.data.data;
  },

  getProductivityScore: async () => {
    const response = await api.get<
      ApiResponse<{
        score: number;
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        trend: 'improving' | 'stable' | 'declining';
        breakdown: { consistency: number; streaks: number; completion: number };
      }>
    >('/analytics/productivity');
    return response.data.data;
  },

  getBestPerforming: async () => {
    const response = await api.get<
      ApiResponse<{
        bestDayOfWeek: { day: string; completionRate: number };
        worstDayOfWeek: { day: string; completionRate: number };
        mostConsistentHabit: { id: string; name: string; color: string; rate: number } | null;
        leastConsistentHabit: { id: string; name: string; color: string; rate: number } | null;
      }>
    >('/analytics/performance');
    return response.data.data;
  },

  getCorrelations: async () => {
    const response = await api.get<
      ApiResponse<{
        correlations: Array<{
          habit1: { id: string; name: string };
          habit2: { id: string; name: string };
          correlation: number;
          interpretation: string;
        }>;
      }>
    >('/analytics/correlations');
    return response.data.data.correlations;
  },

  getPredictions: async () => {
    const response = await api.get<
      ApiResponse<{
        predictions: Array<{
          habitId: string;
          habitName: string;
          currentStreak: number;
          predictedDaysToMilestone: number;
          nextMilestone: number;
          riskLevel: 'low' | 'medium' | 'high';
          riskReason: string | null;
        }>;
      }>
    >('/analytics/predictions');
    return response.data.data.predictions;
  },
};

// Books API
export interface CurrentlyReadingBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progress: number | null;
  pagesReadThisWeek: number;
  avgPagesPerDay: number;
  estimatedDaysToFinish: number | null;
  startedAt: string | null;
}

export const booksApi = {
  getCurrentlyReading: async (): Promise<CurrentlyReadingBook | null> => {
    const response =
      await api.get<ApiResponse<{ book: CurrentlyReadingBook | null }>>('/books/current');
    return response.data.data.book;
  },

  updateProgress: async (bookId: string, currentPage: number, notes?: string) => {
    const response = await api.put(`/books/${bookId}/progress`, { currentPage, notes });
    return response.data.data;
  },

  logReading: async (bookId: string, pagesRead: number, notes?: string) => {
    const response = await api.post(`/books/${bookId}/log`, { pagesRead, notes });
    return response.data.data;
  },
};

// Templates API
export const templatesApi = {
  getAll: async (): Promise<HabitTemplate[]> => {
    const response =
      await api.get<ApiResponse<{ templates: HabitTemplate[] }>>('/habits/templates');
    return response.data.data.templates;
  },

  getByCategory: async (category: string): Promise<HabitTemplate[]> => {
    const response = await api.get<ApiResponse<{ templates: HabitTemplate[] }>>(
      `/habits/templates/category/${category}`
    );
    return response.data.data.templates;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<{ categories: string[] }>>(
      '/habits/templates/categories'
    );
    return response.data.data.categories;
  },

  useTemplate: async (templateId: string): Promise<Habit> => {
    const response = await api.post<ApiResponse<{ habit: Habit }>>(
      `/habits/templates/${templateId}/use`
    );
    return response.data.data.habit;
  },
};
