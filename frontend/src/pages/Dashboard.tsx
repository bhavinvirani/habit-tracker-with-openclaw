import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Flame,
  TrendingUp,
  Calendar,
  Loader2,
  Plus,
  Sparkles,
  CalendarDays,
  Trophy,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { trackingApi, analyticsApi, habitsApi } from '../services/habits';
import { format, subDays } from 'date-fns';
import clsx from 'clsx';
import HabitModal from '../components/habits/HabitModal';
import { Habit } from '../types';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch today's habits
  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ['today'],
    queryFn: trackingApi.getToday,
  });

  // Fetch overview stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['overview'],
    queryFn: analyticsApi.getOverview,
  });

  // Fetch weekly analytics for mini heatmap
  const { data: weeklyData } = useQuery({
    queryKey: ['weekly'],
    queryFn: () => analyticsApi.getWeekly(),
  });

  // Create habit mutation
  const createMutation = useMutation({
    mutationFn: habitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      setIsModalOpen(false);
      toast.success('Habit created successfully!');
    },
    onError: () => {
      toast.error('Failed to create habit');
    },
  });

  // Check-in mutation for habits with target values (increments value)
  const checkInMutation = useMutation({
    mutationFn: ({
      habitId,
      value,
      completed,
    }: {
      habitId: string;
      value?: number;
      completed?: boolean;
    }) => trackingApi.checkIn(habitId, { value, completed }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      if (variables.completed) {
        toast.success('Habit completed! 🎉');
      } else {
        toast.success('Progress updated! 💪');
      }
    },
    onError: () => {
      toast.error('Failed to check in');
    },
  });

  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: (habitId: string) => trackingApi.undo(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      toast.success('Check-in undone');
    },
    onError: () => {
      toast.error('Failed to undo check-in');
    },
  });

  // Handle habit click - increment for numeric habits, toggle for boolean
  const handleHabitClick = (habit: {
    id: string;
    isCompleted: boolean;
    targetValue: number | null;
    logValue: number | null;
    habitType: string;
  }) => {
    const hasGoal = habit.targetValue && habit.targetValue > 0;
    const currentValue = habit.logValue || 0;
    const targetValue = habit.targetValue || 1;
    const isFullyComplete = habit.isCompleted || (hasGoal && currentValue >= targetValue);

    if (isFullyComplete) {
      // Undo the check-in
      undoMutation.mutate(habit.id);
    } else if (hasGoal && habit.habitType !== 'BOOLEAN') {
      // Increment value by 1
      const newValue = currentValue + 1;
      const willComplete = newValue >= targetValue;
      checkInMutation.mutate({
        habitId: habit.id,
        value: newValue,
        completed: willComplete,
      });
    } else {
      // Boolean habit - just mark complete
      checkInMutation.mutate({
        habitId: habit.id,
        completed: true,
      });
    }
  };

  const isLoading = loadingToday || loadingStats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const habits = todayData?.habits || [];
  const completedCount = todayData?.summary?.completed || 0;
  const totalCount = todayData?.summary?.total || 0;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Separate daily and weekly habits
  const dailyHabits = habits.filter((h: any) => h.frequency === 'DAILY');
  const weeklyHabits = habits.filter((h: any) => h.frequency === 'WEEKLY');

  // Calculate daily completion
  const dailyCompleted = dailyHabits.filter((h: any) => {
    const hasGoal = h.targetValue && h.targetValue > 0;
    const currentValue = h.logValue || 0;
    return h.isCompleted || (hasGoal && currentValue >= h.targetValue);
  }).length;
  const allDailyDone = dailyHabits.length > 0 && dailyCompleted === dailyHabits.length;

  // Generate mini heatmap data (last 14 days)
  const heatmapDays = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = weeklyData?.days?.find((d: any) => d.date === dateStr);
    return {
      date: dateStr,
      dayName: format(date, 'EEE'),
      dayNum: format(date, 'd'),
      percentage: dayData?.percentage || 0,
      completed: dayData?.completed || 0,
      total: dayData?.total || 0,
    };
  });

  const handleCreateHabit = (data: Partial<Habit>) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          New Habit
        </button>
      </div>

      {/* Mini Heatmap - Last 14 Days */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Last 14 Days</h2>
          </div>
          <Link to="/calendar" className="text-sm text-primary-400 hover:text-primary-300">
            View Calendar →
          </Link>
        </div>
        <div className="flex gap-1.5">
          {heatmapDays.map((day) => (
            <div key={day.date} className="flex-1 text-center">
              <p className="text-xs text-dark-500 mb-1">{day.dayName}</p>
              <div
                className={clsx(
                  'aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all',
                  day.percentage === 0 && 'bg-dark-800 text-dark-600',
                  day.percentage > 0 && day.percentage < 50 && 'bg-primary-600/20 text-primary-400',
                  day.percentage >= 50 &&
                    day.percentage < 100 &&
                    'bg-primary-600/40 text-primary-300',
                  day.percentage === 100 && 'bg-accent-green/60 text-white'
                )}
                title={`${day.date}: ${day.completed}/${day.total} (${day.percentage}%)`}
              >
                {day.dayNum}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-dark-700">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-dark-800" />
            <span className="text-xs text-dark-500">0%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary-600/20" />
            <span className="text-xs text-dark-500">1-49%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary-600/40" />
            <span className="text-xs text-dark-500">50-99%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-accent-green/60" />
            <span className="text-xs text-dark-500">100%</span>
          </div>
        </div>
      </div>

      {/* Today's Progress Ring + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Progress Ring */}
        <div className="lg:col-span-2 card flex flex-col items-center justify-center py-8">
          <div className="relative w-40 h-40">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-dark-700"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#progressGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - percentage / 100)}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">{percentage}%</span>
              <span className="text-sm text-dark-400">complete</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-white">Today's Progress</p>
            <p className="text-dark-400">
              {completedCount} of {totalCount} habits done
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">Current Streak</span>
              <Flame className="w-5 h-5 text-accent-orange" />
            </div>
            <p className="stat-value text-accent-orange">{stats?.currentBestStreak || 0}</p>
            <p className="text-sm text-dark-500">days in a row</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">Longest Streak</span>
              <TrendingUp className="w-5 h-5 text-accent-green" />
            </div>
            <p className="stat-value text-accent-green">{stats?.longestEverStreak || 0}</p>
            <p className="text-sm text-dark-500">personal best</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">Avg Completion</span>
              <Calendar className="w-5 h-5 text-accent-purple" />
            </div>
            <p className="stat-value text-accent-purple">{stats?.monthlyCompletionRate || 0}%</p>
            <p className="text-sm text-dark-500">last 30 days</p>
          </div>
        </div>
      </div>

      {/* Today's Habits */}
      <div className="space-y-6">
        {habits.length === 0 ? (
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-800 mb-4">
              <Sparkles className="w-8 h-8 text-dark-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No habits yet</h3>
            <p className="text-dark-400 mb-4">Create your first habit to start tracking</p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={18} />
              Create Habit
            </button>
          </div>
        ) : (
          <>
            {/* Daily Habits Section */}
            {dailyHabits.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary-400" />
                      <h2 className="text-lg font-semibold text-white">Daily Habits</h2>
                    </div>
                    {allDailyDone && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-green/20 border border-accent-green/30">
                        <Trophy size={14} className="text-accent-green" />
                        <span className="text-xs font-semibold text-accent-green">
                          All Done for Today!
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-400">
                      {dailyCompleted}/{dailyHabits.length}
                    </span>
                    <div className="h-2 w-24 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full transition-all duration-500',
                          allDailyDone
                            ? 'bg-accent-green'
                            : 'bg-gradient-to-r from-primary-500 to-primary-400'
                        )}
                        style={{
                          width: `${dailyHabits.length > 0 ? (dailyCompleted / dailyHabits.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {dailyHabits.map((habit: any) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onClick={() => handleHabitClick(habit)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Habits Section */}
            {weeklyHabits.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-accent-purple" />
                    <h2 className="text-lg font-semibold text-white">Weekly Habits</h2>
                  </div>
                  <span className="text-xs text-dark-500">Resets every week</span>
                </div>

                <div className="space-y-3">
                  {weeklyHabits.map((habit: any) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onClick={() => handleHabitClick(habit)}
                      isWeekly
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Habit Creation Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateHabit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

// Habit Card Component
interface HabitCardProps {
  habit: any;
  onClick: () => void;
  isWeekly?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onClick, isWeekly }) => {
  const hasGoal = habit.targetValue && habit.targetValue > 0;
  const currentValue = habit.logValue || 0;
  const targetValue = habit.targetValue || 1;
  const goalProgress = hasGoal ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  const isFullyComplete = habit.isCompleted || (hasGoal && currentValue >= targetValue);

  return (
    <div
      className={clsx(
        'relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group',
        isFullyComplete
          ? 'bg-gradient-to-r from-accent-green/10 to-dark-800/50 border-accent-green/30'
          : 'bg-dark-800 border-dark-600 hover:border-dark-500'
      )}
      onClick={onClick}
    >
      {/* Completed indicator */}
      {isFullyComplete && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-green text-dark-900 text-xs font-bold shadow-lg">
          <CheckCircle2 size={12} />
          Done
        </div>
      )}

      <button
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
          isFullyComplete
            ? 'text-white ring-2 ring-accent-green/50 ring-offset-2 ring-offset-dark-800'
            : 'text-dark-500 hover:text-dark-300 group-hover:scale-110'
        )}
        style={{
          backgroundColor: isFullyComplete ? habit.color : 'transparent',
          borderWidth: isFullyComplete ? 0 : 2,
          borderColor: habit.color,
        }}
      >
        {isFullyComplete && <CheckCircle2 size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={clsx(
              'font-medium transition-colors',
              isFullyComplete ? 'text-accent-green' : 'text-white'
            )}
          >
            {habit.icon && <span className="mr-1">{habit.icon}</span>}
            {habit.name}
          </h3>
          {isWeekly && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-accent-purple/20 text-accent-purple">
              Weekly
            </span>
          )}
          {isFullyComplete && <span className="text-xs text-dark-500">(click to undo)</span>}
        </div>

        {/* Goal progress */}
        {hasGoal && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden max-w-[120px]">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-300',
                  isFullyComplete ? 'bg-accent-green' : 'bg-primary-500'
                )}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <span
              className={clsx(
                'text-xs font-medium',
                isFullyComplete ? 'text-accent-green' : 'text-dark-400'
              )}
            >
              {currentValue}/{targetValue} {habit.unit || ''}
            </span>
            {!isFullyComplete && (
              <span className="text-xs text-dark-500">({targetValue - currentValue} left)</span>
            )}
          </div>
        )}

        {!hasGoal && habit.description && (
          <p className="text-sm text-dark-500 truncate">{habit.description}</p>
        )}
      </div>

      {habit.currentStreak > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-orange/10">
          <Flame size={14} className="text-accent-orange" />
          <span className="text-sm font-medium text-accent-orange">{habit.currentStreak}</span>
        </div>
      )}

      <div
        className={clsx('w-1.5 h-10 rounded-full transition-all', isFullyComplete && 'opacity-50')}
        style={{ backgroundColor: habit.color }}
      />
    </div>
  );
};

export default Dashboard;
