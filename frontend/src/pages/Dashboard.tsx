import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { trackingApi, analyticsApi } from '../services/habits';
import { format } from 'date-fns';
import clsx from 'clsx';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

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

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (habitId: string) => trackingApi.checkIn(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
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
    },
    onError: () => {
      toast.error('Failed to undo check-in');
    },
  });

  const handleToggle = (habitId: string, completed: boolean) => {
    if (completed) {
      undoMutation.mutate(habitId);
    } else {
      checkInMutation.mutate(habitId);
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
  const completedCount = todayData?.stats?.completed || 0;
  const totalCount = todayData?.stats?.total || 0;
  const percentage = todayData?.stats?.percentage || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link to="/habits" className="btn btn-primary">
          <Plus size={18} />
          New Habit
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Today's Progress</span>
            <Target className="w-5 h-5 text-primary-400" />
          </div>
          <p className="stat-value text-primary-400">{percentage}%</p>
          <p className="text-sm text-dark-500">
            {completedCount} of {totalCount} completed
          </p>
        </div>

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

      {/* Today's Habits */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Today's Habits</h2>
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-dark-400">{percentage}%</span>
            </div>
          )}
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-800 mb-4">
              <Sparkles className="w-8 h-8 text-dark-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No habits yet</h3>
            <p className="text-dark-400 mb-4">Create your first habit to start tracking</p>
            <Link to="/habits" className="btn btn-primary">
              <Plus size={18} />
              Create Habit
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={clsx(
                  'flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer',
                  habit.completed
                    ? 'bg-dark-800/50 border-dark-700'
                    : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                )}
                onClick={() => handleToggle(habit.id, habit.completed)}
              >
                <button
                  className={clsx(
                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all',
                    habit.completed ? 'text-white' : 'text-dark-500 hover:text-dark-300'
                  )}
                  style={{
                    backgroundColor: habit.completed ? habit.color : 'transparent',
                    borderWidth: habit.completed ? 0 : 2,
                    borderColor: habit.color,
                  }}
                >
                  {habit.completed && <CheckCircle2 size={16} />}
                </button>

                <div className="flex-1 min-w-0">
                  <h3
                    className={clsx(
                      'font-medium transition-colors',
                      habit.completed ? 'text-dark-400 line-through' : 'text-white'
                    )}
                  >
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="text-sm text-dark-500 truncate">{habit.description}</p>
                  )}
                </div>

                {habit.currentStreak > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-orange/10">
                    <Flame size={14} className="text-accent-orange" />
                    <span className="text-sm font-medium text-accent-orange">
                      {habit.currentStreak}
                    </span>
                  </div>
                )}

                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: habit.color }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
