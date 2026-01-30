import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Flame,
  TrendingUp,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subWeeks, addWeeks } from 'date-fns';
import { analyticsApi } from '../services/habits';
import clsx from 'clsx';

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

  const isLoading = loadingOverview || loadingWeekly || loadingStreaks || loadingInsights;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Prepare chart data
  const weeklyChartData =
    weekly?.days?.map((day: any) => ({
      name: (day.dayName || '').slice(0, 3),
      completed: day.completed,
      total: day.total,
      percentage: day.percentage,
    })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-dark-400 mt-1">Track your progress and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Weekly Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Weekly Progress</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-dark-400 min-w-[140px] text-center">
              {weekly?.week?.start && weekly?.week?.end
                ? `${format(new Date(weekly.week.start), 'MMM d')} - ${format(new Date(weekly.week.end), 'MMM d')}`
                : 'This Week'}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                weekOffset >= 0
                  ? 'text-dark-600 cursor-not-allowed'
                  : 'hover:bg-dark-700 text-dark-300 hover:text-white'
              )}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData}>
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" radius={[6, 6, 0, 0]}>
                {weeklyChartData.map((entry: any, index: number) => (
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
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-dark-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{weekly.summary.totalCompleted}</p>
              <p className="text-xs text-dark-400">Total Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-400">{weekly.summary.percentage}%</p>
              <p className="text-xs text-dark-400">Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-green">{weekly.summary.bestDay}</p>
              <p className="text-xs text-dark-400">Best Day</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Streaks */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Streak Leaders</h2>
          {streaks?.streaks?.length > 0 ? (
            <div className="space-y-3">
              {streaks.streaks.slice(0, 5).map((habit: any, index: number) => (
                <div
                  key={habit.habitId}
                  className="flex items-center gap-4 p-3 rounded-lg bg-dark-800"
                >
                  <span
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
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
                  <div className="flex-1">
                    <p className="font-medium text-white">{habit.habitName}</p>
                    <p className="text-xs text-dark-400">Best: {habit.longestStreak} days</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-accent-orange">
                    <Flame size={16} />
                    <span className="font-bold">{habit.currentStreak}</span>
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
            <h2 className="text-xl font-semibold text-white">Insights</h2>
          </div>
          {insights?.suggestions?.length > 0 ? (
            <div className="space-y-3">
              {insights.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="p-4 rounded-lg border bg-dark-800 border-dark-700">
                  <p className="text-sm text-dark-300">{suggestion}</p>
                </div>
              ))}
              {insights.bestDay && (
                <div className="p-4 rounded-lg border bg-accent-green/10 border-accent-green/20">
                  <p className="text-sm text-accent-green">
                    🎯 Your best day is {insights.bestDay.day} with {insights.bestDay.percentage}%
                    completion rate!
                  </p>
                </div>
              )}
              {insights.topHabit && (
                <div className="p-4 rounded-lg border bg-accent-yellow/10 border-accent-yellow/20">
                  <p className="text-sm text-accent-yellow">
                    🔥 Top habit: {insights.topHabit.name} with a {insights.topHabit.streak}-day
                    streak!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-dark-400">Keep tracking to get personalized insights!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
