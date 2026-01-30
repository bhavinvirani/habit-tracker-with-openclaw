export type Frequency = 'DAILY' | 'WEEKLY';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: Frequency;
  color: string;
  icon?: string;
  category?: string;
  goal: number;
  isActive: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  value: number;
  notes?: string;
  createdAt: string;
}

export interface TodayHabit extends Habit {
  completed: boolean;
  log: HabitLog | null;
  currentStreak: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface DashboardStats {
  totalHabits: number;
  activeHabits: number;
  completedToday: number;
  totalToday: number;
  todayPercentage: number;
  currentStreak: number;
  longestStreak: number;
  averageCompletion: number;
}

export interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: Frequency;
  color: string;
  icon: string;
  defaultGoal: number;
  tips: string[];
}

export interface Milestone {
  id: string;
  habitId: string;
  streak: number;
  achievedAt: string;
  habit: {
    name: string;
    color: string;
    icon?: string;
  };
}

// Color options for habits
export const HABIT_COLORS = [
  { name: 'Blue', value: '#2aa3ff' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
];

// Category options for habits
export const HABIT_CATEGORIES = [
  'Health',
  'Fitness',
  'Mindfulness',
  'Productivity',
  'Learning',
  'Social',
  'Finance',
  'Creativity',
  'Other',
];

// Analytics types
export interface WeeklyDay {
  date: string;
  dayName: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface WeeklyStats {
  week: {
    start: string;
    end: string;
  };
  days: WeeklyDay[];
  summary: {
    totalCompleted: number;
    totalPossible: number;
    percentage: number;
    bestDay?: string;
  };
}

export interface MonthlyDay {
  date: string;
  completed: number;
  total: number;
  percentage: number;
  habits?: {
    id: string;
    name: string;
    completed: boolean;
  }[];
}

export interface MonthlyStats {
  days: MonthlyDay[];
  summary: {
    totalCompleted: number;
    totalPossible: number;
    percentage: number;
  };
}

export interface HeatmapStats {
  year: number;
  data: {
    date: string;
    count: number;
    percentage: number;
  }[];
}

export interface HabitAnalytics {
  habitId: string;
  name: string;
  stats: {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    totalCompletions: number;
  };
}

export interface StreakInfo {
  habitId: string;
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  color: string;
}

export interface StreaksData {
  streaks: StreakInfo[];
}

// Insights data with optional suggestions and highlights
export interface InsightsData {
  insights: string[];
  recommendations: string[];
  suggestions?: string[];
  bestDay?: {
    day: string;
    percentage: number;
  };
  topHabit?: {
    name: string;
    streak: number;
  };
}

// Axios Error type
export interface ApiError {
  response?: {
    data?: {
      error?: {
        message: string;
      };
    };
  };
}

// Recharts tooltip props
export interface ChartTooltipProps {
  active?: boolean;
  payload?: {
    value: number;
    payload: {
      total: number;
      percentage: number;
    };
  }[];
  label?: string;
}
