import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Flame,
  TrendingUp,
  Plus,
  CalendarDays,
  Trophy,
  Clock,
  BookOpen,
  Sparkles,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { fireConfetti } from '../utils/confetti';
import {
  trackingApi,
  analyticsApi,
  habitsApi,
  booksApi,
  TodayHabit,
  TodayResponse,
  WeeklyDay,
} from '../services/habits';
import { format, subDays, parseISO } from 'date-fns';
import clsx from 'clsx';
import HabitModal from '../components/habits/HabitModal';
import { Habit } from '../types';
import {
  PageHeader,
  StatCard,
  CircularProgress,
  Button,
  DashboardSkeleton,
  QuickLogDialog,
} from '../components/ui';
import { FeatureGate } from '../contexts/FeatureFlagContext';
import WeeklyInsightsCard from '../components/dashboard/WeeklyInsightsCard';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickLogHabit, setQuickLogHabit] = useState<TodayHabit | null>(null);

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

  // Fetch 14-day analytics for mini heatmap
  const heatmapStartDate = format(subDays(new Date(), 13), 'yyyy-MM-dd');
  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-heatmap', heatmapStartDate],
    queryFn: () => analyticsApi.getWeekly({ startDate: heatmapStartDate }),
  });

  // Fetch currently reading book
  const { data: currentBook } = useQuery({
    queryKey: ['currentBook'],
    queryFn: booksApi.getCurrentlyReading,
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

  // Check-in mutation with optimistic update
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['today'] });
      const previous = queryClient.getQueryData<TodayResponse>(['today']);
      if (previous) {
        queryClient.setQueryData<TodayResponse>(['today'], {
          ...previous,
          habits: previous.habits.map((h) =>
            h.id === variables.habitId
              ? {
                  ...h,
                  isCompleted: variables.completed ?? h.isCompleted,
                  logValue: variables.value ?? h.logValue,
                }
              : h
          ),
          summary: {
            ...previous.summary,
            completed: variables.completed
              ? previous.summary.completed + 1
              : previous.summary.completed,
            remaining: variables.completed
              ? previous.summary.remaining - 1
              : previous.summary.remaining,
          },
        });
      }
      if (variables.completed) {
        toast.success('Habit completed! 🎉');
      } else {
        toast.success('Progress updated! 💪');
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['today'], context.previous);
      }
      toast.error('Failed to check in');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  // Undo mutation with optimistic update
  const undoMutation = useMutation({
    mutationFn: (habitId: string) => trackingApi.undo(habitId),
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: ['today'] });
      const previous = queryClient.getQueryData<TodayResponse>(['today']);
      if (previous) {
        const habit = previous.habits.find((h) => h.id === habitId);
        const wasCompleted = habit?.isCompleted;
        queryClient.setQueryData<TodayResponse>(['today'], {
          ...previous,
          habits: previous.habits.map((h) =>
            h.id === habitId
              ? { ...h, isCompleted: false, logValue: null, logNotes: null, logId: null }
              : h
          ),
          summary: {
            ...previous.summary,
            completed: wasCompleted ? previous.summary.completed - 1 : previous.summary.completed,
            remaining: wasCompleted ? previous.summary.remaining + 1 : previous.summary.remaining,
          },
        });
      }
      toast.success('Check-in undone');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['today'], context.previous);
      }
      toast.error('Failed to undo check-in');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  // Update book progress mutation
  const updateBookProgressMutation = useMutation({
    mutationFn: ({ bookId, currentPage }: { bookId: string; currentPage: number }) =>
      booksApi.updateProgress(bookId, currentPage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentBook'] });
      toast.success('Reading progress updated! 📚');
    },
    onError: () => {
      toast.error('Failed to update progress');
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
      // Open quick log dialog for NUMERIC/DURATION habits
      const fullHabit = habits.find((h: TodayHabit) => h.id === habit.id);
      if (fullHabit) {
        setQuickLogHabit(fullHabit);
      }
    } else {
      // Boolean habit - just mark complete
      checkInMutation.mutate({
        habitId: habit.id,
        completed: true,
      });
    }
  };

  // Handle inline quick-add for NUMERIC/DURATION habits (1-click increment)
  const handleInlineQuickAdd = (habitId: string, amount: number) => {
    const habit = habits.find((h: TodayHabit) => h.id === habitId);
    if (!habit) return;
    const currentValue = habit.logValue || 0;
    const targetValue = habit.targetValue || 1;
    const newValue = currentValue + amount;
    checkInMutation.mutate({
      habitId,
      value: newValue,
      completed: newValue >= targetValue,
    });
  };

  // Handle quick log submission for NUMERIC/DURATION habits
  const handleQuickLog = (value: number, completed: boolean) => {
    if (!quickLogHabit) return;
    checkInMutation.mutate({
      habitId: quickLogHabit.id,
      value,
      completed,
    });
    setQuickLogHabit(null);
  };

  // Fire confetti when all daily habits are completed
  const prevAllDoneRef = useRef(false);
  const allDailyDone = (() => {
    const daily = (todayData?.habits || []).filter((h: TodayHabit) => h.frequency === 'DAILY');
    if (daily.length === 0) return false;
    return daily.every((h: TodayHabit) => {
      const hasGoal = h.targetValue && h.targetValue > 0;
      const currentValue = h.logValue || 0;
      return h.isCompleted || (hasGoal && currentValue >= (h.targetValue || 0));
    });
  })();

  useEffect(() => {
    if (allDailyDone && !prevAllDoneRef.current) {
      fireConfetti();
    }
    prevAllDoneRef.current = allDailyDone;
  }, [allDailyDone]);

  const isLoading = loadingToday || loadingStats;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const habits = todayData?.habits || [];
  const completedCount = todayData?.summary?.completed || 0;
  const totalCount = todayData?.summary?.total || 0;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Separate daily and weekly habits
  const dailyHabits = habits.filter((h: TodayHabit) => h.frequency === 'DAILY');
  const weeklyHabits = habits.filter((h: TodayHabit) => h.frequency === 'WEEKLY');

  // Calculate daily completion
  const dailyCompleted = dailyHabits.filter((h: TodayHabit) => {
    const hasGoal = h.targetValue && h.targetValue > 0;
    const currentValue = h.logValue || 0;
    return h.isCompleted || (hasGoal && currentValue >= (h.targetValue || 0));
  }).length;

  // Generate mini heatmap data (last 14 days)
  const heatmapDays = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = weeklyData?.days?.find((d: WeeklyDay) => d.date === dateStr);
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
      <PageHeader
        title="Dashboard"
        subtitle={
          todayData?.date
            ? format(parseISO(todayData.date), 'EEEE, MMMM d, yyyy')
            : format(new Date(), 'EEEE, MMMM d, yyyy')
        }
        action={
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            New Habit
          </Button>
        }
      />

      {/* Today's Progress Ring + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Ring */}
        <div className="card flex flex-col items-center justify-center py-8">
          <CircularProgress
            percent={percentage}
            size={160}
            strokeWidth={12}
            gradientColors={['#6366f1', '#22c55e']}
            label="complete"
            gradientId="dashboardProgress"
          />
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-white">Today's Progress</p>
            <p className="text-dark-400">
              {completedCount} of {totalCount} habits done
            </p>
          </div>
        </div>

        {/* Stats Cards - Compact Row */}
        <div className="card p-4">
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-4">
            Your Stats
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={Flame}
              value={stats?.currentBestStreak || 0}
              label="Current Streak"
              color="orange"
            />
            <StatCard
              icon={Trophy}
              value={stats?.longestEverStreak || 0}
              label="Best Streak"
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              value={stats?.monthlyCompletionRate || 0}
              label="30-Day Avg"
              suffix="%"
              color="purple"
            />
          </div>

          {/* Additional Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-dark-700">
            <StatCard
              icon={CheckCircle2}
              value={stats?.totalCompletions || 0}
              label="Total Check-ins"
              color="primary"
              variant="minimal"
            />
            <StatCard
              icon={CalendarDays}
              value={stats?.activeHabits || 0}
              label="Active Habits"
              color="yellow"
              variant="minimal"
            />
          </div>
        </div>
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

      {/* AI Weekly Insights Card */}
      <FeatureGate flag="ai_insights">
        <WeeklyInsightsCard />
      </FeatureGate>

      {/* Currently Reading Widget - Compact with Progress Bar */}
      <div className="card p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-blue" />
            <h3 className="text-sm font-medium text-white">Currently Reading</h3>
          </div>
          <Link to="/books" className="text-xs text-primary-400 hover:text-primary-300">
            View all →
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Book Icon / Cover */}
          <Link to="/books" className="flex-shrink-0">
            {currentBook?.coverUrl ? (
              <div className="w-12 h-16 rounded-lg overflow-hidden hover:scale-105 transition-transform">
                <img
                  src={currentBook.coverUrl}
                  alt={currentBook.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent-blue" />
              </div>
            )}
          </Link>

          {/* Book Info & Progress */}
          <div className="flex-1 min-w-0">
            {currentBook ? (
              <>
                <div className="min-w-0">
                  <h3 className="font-medium text-white text-sm truncate">{currentBook.title}</h3>
                  <p className="text-xs text-dark-400 truncate">{currentBook.author}</p>
                </div>
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${currentBook.progress ?? (currentBook.totalPages ? Math.round((currentBook.currentPage / currentBook.totalPages) * 100) : 0)}%`,
                          background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-blue-400 w-10 text-right">
                      {currentBook.progress ??
                        (currentBook.totalPages
                          ? Math.round((currentBook.currentPage / currentBook.totalPages) * 100)
                          : 0)}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-dark-500">
                      p.{currentBook.currentPage}
                      {currentBook.totalPages ? `/${currentBook.totalPages}` : ''}
                      {currentBook.pagesReadThisWeek > 0 && (
                        <span className="text-dark-400">
                          {' '}
                          · {currentBook.pagesReadThisWeek} this week
                        </span>
                      )}
                    </span>
                    {currentBook.estimatedDaysToFinish && (
                      <span className="text-xs text-dark-500">
                        ~{currentBook.estimatedDaysToFinish}d left
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-dark-400">
                No book in progress. Start reading to track your progress!
              </p>
            )}
          </div>

          {/* Quick Page Update Buttons */}
          {currentBook && (
            <div className="flex-shrink-0 flex gap-1.5">
              {[5, 10, 25, 50].map((increment) => {
                const newPage = currentBook.currentPage + increment;
                const isDisabled = !!(currentBook.totalPages && newPage > currentBook.totalPages);
                return (
                  <button
                    key={increment}
                    onClick={() => {
                      if (!isDisabled) {
                        updateBookProgressMutation.mutate({
                          bookId: currentBook.id,
                          currentPage: Math.min(newPage, currentBook.totalPages || newPage),
                        });
                      }
                    }}
                    disabled={updateBookProgressMutation.isPending || isDisabled}
                    className={clsx(
                      'py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all',
                      isDisabled
                        ? 'bg-dark-800 text-dark-600 cursor-not-allowed'
                        : 'bg-dark-700 text-dark-300 hover:bg-accent-blue/20 hover:text-accent-blue'
                    )}
                  >
                    +{increment}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Today's Habits */}
      <div className="space-y-6">
        {habits.length === 0 ? (
          <motion.div
            className="card text-center py-16"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 border border-primary-500/10 mb-5"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-10 h-10 text-primary-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">Start your journey</h3>
            <p className="text-dark-400 mb-6 max-w-xs mx-auto">
              Create your first habit and begin building a better routine, one day at a time.
            </p>
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} />
              Create Your First Habit
            </motion.button>
          </motion.div>
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

                <motion.div
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.04 } },
                  }}
                >
                  {dailyHabits.map((habit: TodayHabit) => (
                    <motion.div
                      key={habit.id}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                      }}
                    >
                      <HabitCard
                        habit={habit}
                        onClick={() => handleHabitClick(habit)}
                        onQuickAdd={handleInlineQuickAdd}
                      />
                    </motion.div>
                  ))}
                </motion.div>
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

                <motion.div
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.04 } },
                  }}
                >
                  {weeklyHabits.map((habit: TodayHabit) => (
                    <motion.div
                      key={habit.id}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                      }}
                    >
                      <HabitCard
                        habit={habit}
                        onClick={() => handleHabitClick(habit)}
                        onQuickAdd={handleInlineQuickAdd}
                        isWeekly
                      />
                    </motion.div>
                  ))}
                </motion.div>
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

      {/* Quick Log Dialog for NUMERIC/DURATION habits */}
      <QuickLogDialog
        isOpen={!!quickLogHabit}
        onClose={() => setQuickLogHabit(null)}
        onSubmit={handleQuickLog}
        habitName={quickLogHabit?.name || ''}
        habitIcon={quickLogHabit?.icon || null}
        habitColor={quickLogHabit?.color || '#6366f1'}
        currentValue={quickLogHabit?.logValue || 0}
        targetValue={quickLogHabit?.targetValue || 1}
        unit={quickLogHabit?.unit || null}
        loading={checkInMutation.isPending}
      />
    </div>
  );
};

// Quick-add button increments based on target value
function getQuickAddButtons(target: number): number[] {
  if (target <= 10) return [1, 2, 5];
  if (target <= 30) return [1, 5, 10];
  return [5, 10, 15];
}

// Habit Card Component
interface HabitCardProps {
  habit: TodayHabit;
  onClick: () => void;
  onQuickAdd?: (habitId: string, amount: number) => void;
  isWeekly?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onClick, onQuickAdd, isWeekly }) => {
  const hasGoal = habit.targetValue && habit.targetValue > 0;
  const currentValue = habit.logValue || 0;
  const targetValue = habit.targetValue || 1;
  const goalProgress = hasGoal ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  const isFullyComplete = habit.isCompleted || (hasGoal && currentValue >= targetValue);
  const isNumericOrDuration = habit.habitType === 'NUMERIC' || habit.habitType === 'DURATION';
  const showQuickAdd = !!(isNumericOrDuration && hasGoal && !isFullyComplete && onQuickAdd);
  const quickAddAmounts = showQuickAdd ? getQuickAddButtons(targetValue) : [];
  const remaining = Math.max(targetValue - currentValue, 0);

  return (
    <div
      className={clsx(
        'relative p-3 rounded-xl border transition-all cursor-pointer group',
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

      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Checkbox circle */}
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

        {/* Name + badges */}
        <div className={clsx('min-w-0', !showQuickAdd && 'flex-1')}>
          <div className="flex items-center gap-2">
            <h3
              className={clsx(
                'font-medium transition-colors whitespace-nowrap',
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
            {!showQuickAdd && habit.category && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded text-xs',
                  isFullyComplete ? 'bg-dark-700/50 text-dark-600' : 'bg-dark-700 text-dark-400'
                )}
              >
                {habit.category}
              </span>
            )}
          </div>

          {/* Description for non-goal, non-quick-add habits */}
          {!hasGoal && habit.description && (
            <p
              className={clsx(
                'text-sm truncate mt-0.5',
                isFullyComplete ? 'text-dark-600 line-through' : 'text-dark-500'
              )}
            >
              {habit.description}
            </p>
          )}
        </div>

        {/* Inline quick-add buttons for NUMERIC/DURATION habits */}
        {showQuickAdd && onQuickAdd && (
          <div className="flex-1 flex items-center justify-end gap-1.5">
            {quickAddAmounts.map((amount) => (
              <button
                key={amount}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(habit.id, amount);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-dark-700 text-xs font-medium text-dark-300 transition-all"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${habit.color}33`;
                  e.currentTarget.style.color = habit.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.color = '';
                }}
              >
                +{amount}
              </button>
            ))}
            {/* Done: complete to target */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(habit.id, remaining);
              }}
              className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
              style={{
                backgroundColor: `${habit.color}33`,
                color: habit.color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${habit.color}4D`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${habit.color}33`;
              }}
            >
              <Check size={14} />
            </button>
          </div>
        )}

        {/* Streak badge */}
        {habit.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-orange/10">
            <Flame size={14} className="text-accent-orange" />
            <span className="text-sm font-medium text-accent-orange">{habit.currentStreak}</span>
          </div>
        )}

        {/* Color accent bar */}
        <div
          className={clsx(
            'w-1.5 h-10 rounded-full transition-all',
            isFullyComplete && 'opacity-50'
          )}
          style={{ backgroundColor: habit.color }}
        />
      </div>

      {/* Bottom row: progress bar for goal habits */}
      {hasGoal && (
        <div className="mt-2 pl-11">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={clsx(
                'text-xs font-medium',
                isFullyComplete ? 'text-accent-green' : 'text-dark-400'
              )}
            >
              {currentValue}/{targetValue} {habit.unit || ''}
            </span>
            {!isFullyComplete && <span className="text-xs text-dark-500">({remaining} left)</span>}
          </div>
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300',
                isFullyComplete ? 'bg-accent-green' : ''
              )}
              style={{
                width: `${goalProgress}%`,
                backgroundColor: isFullyComplete ? undefined : habit.color,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
