import api from './api';
import { Habit, HabitLog } from '../types';

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

interface TodayHabit extends Habit {
  completed: boolean;
  log: HabitLog | null;
  currentStreak: number;
}

interface TodayResponse {
  date: string;
  habits: TodayHabit[];
  stats: {
    total: number;
    completed: number;
    percentage: number;
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

interface WeeklyStats {
  week: {
    start: string;
    end: string;
  };
  days: Array<{
    date: string;
    dayName: string;
    completed: number;
    total: number;
    percentage: number;
    habits: Array<{ id: string; name: string; completed: boolean }>;
  }>;
  summary: {
    totalCompleted: number;
    totalPossible: number;
    percentage: number;
    bestDay: string;
    worstDay: string;
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

// Habits API
export const habitsApi = {
  getAll: async (): Promise<HabitWithStats[]> => {
    const response = await api.get<ApiResponse<{ habits: HabitWithStats[] }>>('/habits');
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
};

// Tracking API
export const trackingApi = {
  getToday: async (): Promise<TodayResponse> => {
    const response = await api.get<ApiResponse<TodayResponse>>('/tracking/today');
    return response.data.data;
  },

  checkIn: async (habitId: string, data?: { notes?: string; date?: string }): Promise<HabitLog> => {
    const response = await api.post<ApiResponse<{ log: HabitLog }>>(
      `/tracking/check-in`,
      { habitId, ...data }
    );
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

  getMilestones: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<{ milestones: any[] }>>('/tracking/milestones');
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

  getMonthly: async (year?: number, month?: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/analytics/monthly', {
      params: { year, month },
    });
    return response.data.data;
  },

  getHeatmap: async (year?: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/analytics/heatmap', {
      params: { year },
    });
    return response.data.data;
  },

  getHabitStats: async (habitId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/analytics/habits/${habitId}`);
    return response.data.data;
  },

  getStreaks: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/analytics/streaks');
    return response.data.data;
  },

  getInsights: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/analytics/insights');
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
