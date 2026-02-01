import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  TrendingUp,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';
import { format, subWeeks, addWeeks } from 'date-fns';
import { analyticsApi } from '../services/habits';
import clsx from 'clsx';
import { WeeklyDay, StreakInfo, ChartTooltipProps } from '../types';
import { LoadingSpinner, PageHeader } from '../components/ui';

const Analytics: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDate =
    weekOffset === 0
      ? undefined
      : format(
          weekOffset > 0
            ? addWeeks(new Date(), weekOffset)
            : subWeeks(new Date(), Math.abs(weekOffset)),
          'yyyy-MM-dd'
        );

  // Fetch data
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['overview'],
    queryFn: analyticsApi.getOverview,
  });

  const { data: weekly, isLoading: loadingWeekly } = useQuery({
    queryKey: ['weekly', weekDate],
    queryFn: () => analyticsApi.getWeekly(weekDate),
  });

  const { data: streaks, isLoading: loadingStreaks } = useQuery({
    queryKey: ['streaks'],
    queryFn: analyticsApi.getStreaks,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: analyticsApi.getInsights,
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: analyticsApi.getCategoryBreakdown,
  });

  const { data: comparison, isLoading: loadingComparison } = useQuery({
    queryKey: ['comparison'],
    queryFn: analyticsApi.getWeekComparison,
  });

  const { data: trend, isLoading: loadingTrend } = useQuery({
    queryKey: ['trend'],
    queryFn: analyticsApi.getMonthlyTrend,
  });

  const isLoading =
    loadingOverview ||
    loadingWeekly ||
    loadingStreaks ||
    loadingInsights ||
    loadingCategories ||
    loadingComparison ||
    loadingTrend;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Prepare chart data
  const weeklyChartData =
    weekly?.days?.map((day: WeeklyDay) => ({
      name: format(new Date(day.date), 'EEE'),
      completed: day.completed,
      total: day.total,
      percentage: day.percentage,
    })) || [];

  const categoryChartData =
    categories?.categories?.map((cat) => ({
      name: cat.name,
      value: cat.completionRate,
      color: cat.color,
      habitCount: cat.habitCount,
    })) || [];

  const trendChartData =
    trend?.days?.map((day) => ({
      date: format(new Date(day.date), 'MMM d'),
      rate: day.rate,
      completed: day.completed,
    })) || [];

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-primary-400 text-sm">
            {payload[0].value} of {payload[0].payload.total} completed
          </p>
          <p className="text-dark-400 text-xs">{payload[0].payload.percentage}% success rate</p>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-primary-400 text-sm">{payload[0].value}% completion</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Track your progress and insights" />

      {/* Week Comparison Banner */}
      {comparison && (
        <div
          className={clsx(
            'p-4 rounded-xl border flex items-center justify-between',
            comparison.trend === 'up'
              ? 'bg-accent-green/10 border-accent-green/20'
              : comparison.trend === 'down'
                ? 'bg-accent-red/10 border-accent-red/20'
                : 'bg-dark-800 border-dark-700'
          )}
        >
          <div className="flex items-center gap-4">
            {comparison.trend === 'up' ? (
              <div className="w-12 h-12 rounded-full bg-accent-green/20 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-accent-green" />
              </div>
            ) : comparison.trend === 'down' ? (
              <div className="w-12 h-12 rounded-full bg-accent-red/20 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-accent-red" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center">
                <Minus className="w-6 h-6 text-dark-400" />
              </div>
            )}
            <div>
              <p className="text-white font-semibold">
                {comparison.trend === 'up'
                  ? "You're doing better this week!"
                  : comparison.trend === 'down'
                    ? 'Room for improvement this week'
                    : 'Staying consistent!'}
              </p>
              <p className="text-sm text-dark-400">
                {comparison.thisWeek.rate}% this week vs {comparison.lastWeek.rate}% last week
              </p>
            </div>
          </div>
          <div
            className={clsx(
              'text-3xl font-bold',
              comparison.trend === 'up'
                ? 'text-accent-green'
                : comparison.trend === 'down'
                  ? 'text-accent-red'
                  : 'text-dark-400'
            )}
          >
            {comparison.change > 0 ? '+' : ''}
            {comparison.change}%
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Current Streak</span>
            <Flame className="w-5 h-5 text-accent-orange" />
          </div>
          <p className="stat-value text-accent-orange">{overview?.currentBestStreak || 0}</p>
          <p className="text-sm text-dark-500">days in a row</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Best Streak</span>
            <TrendingUp className="w-5 h-5 text-accent-green" />
          </div>
          <p className="stat-value text-accent-green">{overview?.longestEverStreak || 0}</p>
          <p className="text-sm text-dark-500">personal record</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Avg Completion</span>
            <Target className="w-5 h-5 text-primary-400" />
          </div>
          <p className="stat-value text-primary-400">{overview?.monthlyCompletionRate || 0}%</p>
          <p className="text-sm text-dark-500">last 30 days</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Active Habits</span>
            <Calendar className="w-5 h-5 text-accent-purple" />
          </div>
          <p className="stat-value text-accent-purple">{overview?.activeHabits || 0}</p>
          <p className="text-sm text-dark-500">being tracked</p>
        </div>
      </div>

      {/* 30-Day Trend */}
      {trend && trendChartData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">30-Day Trend</h2>
              <p className="text-sm text-dark-400">Daily completion rate over the past month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-400">{trend.averageRate}%</p>
              <p className="text-xs text-dark-500">average</p>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2aa3ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2aa3ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#2aa3ff"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weekly Chart & Category Breakdown Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Weekly Progress</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-dark-400 min-w-[100px] text-center">
                {weekly?.days && weekly.days.length > 0
                  ? `${format(new Date(weekly.days[0].date), 'MMM d')} - ${format(new Date(weekly.days[weekly.days.length - 1].date), 'MMM d')}`
                  : 'This Week'}
              </span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={weekOffset >= 0}
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  weekOffset >= 0
                    ? 'text-dark-600 cursor-not-allowed'
                    : 'hover:bg-dark-700 text-dark-300 hover:text-white'
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {weeklyChartData.map((entry: { percentage: number }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.percentage >= 80
                          ? '#10b981'
                          : entry.percentage >= 50
                            ? '#2aa3ff'
                            : '#475569'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Week Summary */}
          {weekly?.summary && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-dark-700">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{weekly.summary.completed}</p>
                <p className="text-xs text-dark-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary-400">{weekly.summary.rate}%</p>
                <p className="text-xs text-dark-400">Success</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-dark-300">{weekly.summary.total}</p>
                <p className="text-xs text-dark-400">Expected</p>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">By Category</h2>
          {categoryChartData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryChartData.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-dark-300 flex-1 truncate">{cat.name}</span>
                    <span className="text-sm font-medium text-white">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">No category data yet</p>
          )}
        </div>
      </div>

      {/* Habit Completion Rates */}
      {categories?.habitRates && categories.habitRates.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Habit Performance (30 days)</h2>
          </div>
          <div className="space-y-3">
            {categories.habitRates.slice(0, 8).map((habit) => (
              <div key={habit.id} className="flex items-center gap-3">
                <span className="text-lg">{habit.icon || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate">{habit.name}</span>
                    <span className="text-sm font-medium text-dark-300">
                      {habit.completionRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${habit.completionRate}%`,
                        backgroundColor:
                          habit.completionRate >= 80
                            ? '#10b981'
                            : habit.completionRate >= 50
                              ? '#2aa3ff'
                              : '#ef4444',
                      }}
                    />
                  </div>
                </div>
                {habit.currentStreak > 0 && (
                  <div className="flex items-center gap-1 text-accent-orange text-xs">
                    <Flame size={12} />
                    <span>{habit.currentStreak}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Streaks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Streak Leaders</h2>
          {streaks?.streaks && streaks.streaks.length > 0 ? (
            <div className="space-y-2">
              {streaks.streaks.slice(0, 5).map((habit: StreakInfo, index: number) => (
                <div
                  key={habit.habitId}
                  className="flex items-center gap-3 p-2 rounded-lg bg-dark-800"
                >
                  <span
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0
                        ? 'bg-accent-yellow/20 text-accent-yellow'
                        : index === 1
                          ? 'bg-dark-500/20 text-dark-300'
                          : index === 2
                            ? 'bg-accent-orange/20 text-accent-orange'
                            : 'bg-dark-700 text-dark-400'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{habit.habitName}</p>
                    <p className="text-xs text-dark-400">Best: {habit.longestStreak}d</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent-orange">
                    <Flame size={14} />
                    <span className="font-bold text-sm">{habit.currentStreak}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">No streak data yet</p>
          )}
        </div>

        {/* Insights */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-accent-yellow" />
            <h2 className="text-lg font-semibold text-white">Insights</h2>
          </div>

          {/* Best Day & Top Habit Cards */}
          {(insights?.bestDay || insights?.topHabit) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {insights?.bestDay && (
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/20">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm">🎯</span>
                    <span className="text-xs text-accent-green font-medium">Best Day</span>
                  </div>
                  <p className="text-lg font-bold text-white">{insights.bestDay.day}</p>
                  <p className="text-xs text-dark-400">{insights.bestDay.percentage}%</p>
                </div>
              )}
              {insights?.topHabit && (
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent-orange/20 to-accent-orange/5 border border-accent-orange/20">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs text-accent-orange font-medium">Top Streak</span>
                  </div>
                  <p className="text-lg font-bold text-white">{insights.topHabit.streak}d</p>
                  <p className="text-xs text-dark-400 truncate">{insights.topHabit.name}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {insights?.suggestions && insights.suggestions?.length > 0 ? (
            <div className="space-y-2">
              {insights.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                <div
                  key={index}
                  className="p-2 rounded-lg bg-dark-800/50 border border-dark-700/50 flex items-start gap-2"
                >
                  <span className="text-primary-400 text-sm">💡</span>
                  <p className="text-xs text-dark-300 leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-dark-400 text-xs">Keep tracking to get insights!</p>
            </div>
          )}

          {/* Needs Attention */}
          {insights?.needsAttention && insights.needsAttention.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dark-700">
              <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-2">
                Needs Attention
              </p>
              <div className="space-y-1">
                {insights.needsAttention
                  .slice(0, 2)
                  .map((item: { name: string; missedDays: number }, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-1.5 rounded bg-accent-red/10 border border-accent-red/20"
                    >
                      <span className="text-xs text-dark-300 truncate">{item.name}</span>
                      <span className="text-xs text-accent-red">{item.missedDays}d</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
