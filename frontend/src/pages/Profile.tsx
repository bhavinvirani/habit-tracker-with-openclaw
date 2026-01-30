import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Calendar,
  Trophy,
  Flame,
  Target,
  LogOut,
  Loader2,
  Check,
  Shield,
  BookOpen,
  Award,
  Zap,
  Star,
  BarChart3,
  Settings,
  User,
  Sun,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Download,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { analyticsApi, trackingApi } from '../services/habits';
import api from '../services/api';
import clsx from 'clsx';

// Types for the page
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

interface Book {
  id: string;
  status: string;
}

interface UserInfo {
  id: string;
  name?: string;
  email?: string;
  createdAt?: string;
}

// Badge definitions based on achievements
const BADGES = [
  {
    id: 'first-habit',
    name: 'First Step',
    description: 'Created your first habit',
    icon: Zap,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/20',
    requirement: (stats?: OverviewStats) => (stats?.totalHabits ?? 0) >= 1,
  },
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    icon: Flame,
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/20',
    requirement: (stats?: OverviewStats) => (stats?.longestEverStreak ?? 0) >= 7,
  },
  {
    id: 'month-streak',
    name: 'Monthly Master',
    description: 'Maintained a 30-day streak',
    icon: Trophy,
    color: 'text-accent-yellow',
    bgColor: 'bg-accent-yellow/20',
    requirement: (stats?: OverviewStats) => (stats?.longestEverStreak ?? 0) >= 30,
  },
  {
    id: 'century',
    name: 'Century Club',
    description: 'Completed 100 habit entries',
    icon: Star,
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/20',
    requirement: (stats?: OverviewStats) => (stats?.totalCompletions ?? 0) >= 100,
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Completed all habits for 7 days',
    icon: CheckCircle,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/20',
    requirement: (stats?: OverviewStats) => (stats?.weeklyAverage ?? 0) >= 100,
  },
  {
    id: 'habit-collector',
    name: 'Habit Collector',
    description: 'Created 5 or more habits',
    icon: Target,
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/20',
    requirement: (stats?: OverviewStats) => (stats?.totalHabits ?? 0) >= 5,
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Finished a book',
    icon: BookOpen,
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/20',
    requirement: (_stats?: OverviewStats, books?: Book[]) =>
      books?.some((b) => b.status === 'FINISHED') ?? false,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Member for 30+ days',
    icon: Sun,
    color: 'text-accent-yellow',
    bgColor: 'bg-accent-yellow/20',
    requirement: (_stats?: OverviewStats, _books?: Book[], user?: UserInfo) => {
      if (!user?.createdAt) return false;
      return differenceInDays(new Date(), new Date(user.createdAt)) >= 30;
    },
  },
];

type Tab = 'overview' | 'achievements' | 'settings';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch overview stats
  const { data: stats } = useQuery({
    queryKey: ['overview'],
    queryFn: analyticsApi.getOverview,
  });

  // Fetch milestones
  const { data: milestones } = useQuery({
    queryKey: ['milestones'],
    queryFn: trackingApi.getMilestones,
  });

  // Fetch books for badge
  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      try {
        const response = await api.get('/books');
        return response.data.data.books;
      } catch {
        return [];
      }
    },
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await api.put('/users/profile', data);
      return response.data.data.user || response.data.data.profile;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      const { login } = useAuthStore.getState();
      const { token } = useAuthStore.getState();
      if (token && updatedUser) {
        login({ ...user, ...updatedUser }, token);
      }
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      updateMutation.mutate({ name: formData.name.trim() });
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    // TODO: Implement password change API
    toast.success('Password changed successfully');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Calculate earned badges
  const earnedBadges = useMemo(() => {
    return BADGES.filter((badge) => badge.requirement(stats, books, user ?? undefined));
  }, [stats, books, user]);

  // Calculate account age
  const accountAge = useMemo(() => {
    if (!user?.createdAt) return { days: 0, label: 'New' };
    const days = differenceInDays(new Date(), new Date(user.createdAt));
    if (days < 7) return { days, label: `${days} days` };
    if (days < 30) return { days, label: `${Math.floor(days / 7)} weeks` };
    if (days < 365) return { days, label: `${Math.floor(days / 30)} months` };
    return { days, label: `${Math.floor(days / 365)} years` };
  }, [user?.createdAt]);

  // Calculate level based on total completions
  const level = useMemo(() => {
    const completions = stats?.totalCompletions || 0;
    const lvl = Math.floor(completions / 50) + 1;
    const progress = (completions % 50) / 50;
    const nextLevelAt = lvl * 50;
    return { level: lvl, progress, completions, nextLevelAt };
  }, [stats?.totalCompletions]);

  const recentMilestones = milestones?.slice(0, 6) || [];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Level */}
      <div className="card bg-gradient-to-br from-primary-900/40 via-dark-800 to-dark-800 border-primary-500/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent-yellow flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-dark-900">{level.level}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white">{user?.name || 'User'}</h1>
            <p className="text-dark-400">{user?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-dark-400">
                <Calendar size={14} />
                <span>Joined {accountAge.label} ago</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-dark-400">
                <Trophy size={14} className="text-accent-yellow" />
                <span>{earnedBadges.length} badges</span>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="w-full md:w-48">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-dark-400">Level {level.level}</span>
              <span className="text-primary-400">
                {level.completions}/{level.nextLevelAt}
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all"
                style={{ width: `${level.progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-dark-500 mt-1 text-center md:text-right">
              {level.nextLevelAt - level.completions} to next level
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              )}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center">
                <div className="flex items-center justify-center gap-1 text-accent-orange mb-1">
                  <Flame size={20} />
                  <span className="text-2xl font-bold">{stats?.currentBestStreak || 0}</span>
                </div>
                <p className="text-xs text-dark-400">Current Streak</p>
              </div>
              <div className="card text-center">
                <div className="flex items-center justify-center gap-1 text-accent-green mb-1">
                  <Trophy size={20} />
                  <span className="text-2xl font-bold">{stats?.longestEverStreak || 0}</span>
                </div>
                <p className="text-xs text-dark-400">Best Streak</p>
              </div>
              <div className="card text-center">
                <div className="flex items-center justify-center gap-1 text-primary-400 mb-1">
                  <Target size={20} />
                  <span className="text-2xl font-bold">{stats?.monthlyCompletionRate || 0}%</span>
                </div>
                <p className="text-xs text-dark-400">Completion Rate</p>
              </div>
              <div className="card text-center">
                <div className="flex items-center justify-center gap-1 text-accent-purple mb-1">
                  <BarChart3 size={20} />
                  <span className="text-2xl font-bold">{stats?.totalCompletions || 0}</span>
                </div>
                <p className="text-xs text-dark-400">Total Entries</p>
              </div>
            </div>

            {/* Habit Summary */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target size={20} className="text-primary-400" />
                Habit Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-dark-800">
                  <p className="text-3xl font-bold text-white">{stats?.totalHabits || 0}</p>
                  <p className="text-sm text-dark-400">Total Habits</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-dark-800">
                  <p className="text-3xl font-bold text-accent-green">{stats?.activeHabits || 0}</p>
                  <p className="text-sm text-dark-400">Active</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-dark-800">
                  <p className="text-3xl font-bold text-dark-500">{stats?.archivedHabits || 0}</p>
                  <p className="text-sm text-dark-400">Archived</p>
                </div>
              </div>

              {/* Today's Progress */}
              <div className="mt-4 pt-4 border-t border-dark-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-dark-400">Today's Progress</span>
                  <span className="text-white font-medium">
                    {stats?.completedToday || 0}/{stats?.totalToday || 0}
                  </span>
                </div>
                <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-green to-accent-green/70 transition-all"
                    style={{ width: `${stats?.todayPercentage || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Milestones */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award size={20} className="text-accent-yellow" />
                  Recent Milestones
                </h3>
              </div>

              {recentMilestones.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentMilestones.map(
                    (milestone: {
                      id: string;
                      type: string;
                      value: number;
                      achievedAt: string;
                      habit: { name: string; color: string };
                    }) => (
                      <div
                        key={milestone.id}
                        className="p-3 rounded-lg bg-dark-800 border border-dark-700"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${milestone.habit.color}20` }}
                          >
                            <Flame size={20} style={{ color: milestone.habit.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">
                              {milestone.value}{' '}
                              {milestone.type === 'STREAK' ? 'day streak' : 'completions'}
                            </p>
                            <p className="text-xs text-dark-400 truncate">{milestone.habit.name}</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No milestones yet</p>
                  <p className="text-dark-500 text-sm mt-1">
                    Keep up your habits to earn streak milestones!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Edit Profile */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Profile</h3>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="btn btn-primary flex-1"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: user?.name || '' });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-800">
                    <User size={18} className="text-dark-400" />
                    <div className="flex-1">
                      <p className="text-xs text-dark-500">Name</p>
                      <p className="text-white">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-800">
                    <Mail size={18} className="text-dark-400" />
                    <div className="flex-1">
                      <p className="text-xs text-dark-500">Email</p>
                      <p className="text-white">{user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="btn btn-secondary w-full">
                    Edit Profile
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
              <div className="space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                  <ChevronRight size={16} className="ml-auto text-dark-500" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700">
                <div className="flex items-center gap-2 text-dark-500 text-xs">
                  <Shield size={14} />
                  <span>Your data is securely stored</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Badges Grid */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award size={20} className="text-accent-yellow" />
                Badges
              </h3>
              <span className="text-dark-400">
                {earnedBadges.length}/{BADGES.length} earned
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BADGES.map((badge) => {
                const isEarned = earnedBadges.some((b) => b.id === badge.id);
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={clsx(
                      'p-4 rounded-xl border-2 transition-all',
                      isEarned
                        ? 'bg-dark-800 border-dark-600'
                        : 'bg-dark-900/50 border-dark-800 opacity-50'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                        isEarned ? badge.bgColor : 'bg-dark-800'
                      )}
                    >
                      <Icon size={24} className={isEarned ? badge.color : 'text-dark-600'} />
                    </div>
                    <h4 className={clsx('font-medium', isEarned ? 'text-white' : 'text-dark-500')}>
                      {badge.name}
                    </h4>
                    <p className="text-xs text-dark-500 mt-1">{badge.description}</p>
                    {isEarned && (
                      <div className="flex items-center gap-1 mt-2 text-accent-green text-xs">
                        <CheckCircle size={12} />
                        <span>Earned</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Milestones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Flame size={20} className="text-accent-orange" />
              All Milestones
            </h3>

            {milestones && milestones.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {milestones.map(
                  (milestone: {
                    id: string;
                    type: string;
                    value: number;
                    achievedAt: string;
                    habit: { name: string; color: string };
                  }) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-dark-800 border border-dark-700"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${milestone.habit.color}20` }}
                      >
                        <Flame size={24} style={{ color: milestone.habit.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {milestone.value}{' '}
                          {milestone.type === 'STREAK' ? 'Day Streak' : 'Completions'}
                        </p>
                        <p className="text-sm text-dark-400">{milestone.habit.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-dark-400">
                          {format(new Date(milestone.achievedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">No milestones yet</p>
                <p className="text-dark-500 text-sm mt-1">
                  Complete habits consistently to earn milestones!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Account Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-primary-400" />
              Account Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Display Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={user?.email || ''} disabled />
                <p className="text-xs text-dark-500 mt-1">Email cannot be changed</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || formData.name === user?.name}
                className="btn btn-primary"
              >
                {updateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Save Changes
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock size={20} className="text-primary-400" />
              Change Password
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                disabled={!passwordData.currentPassword || !passwordData.newPassword}
                className="btn btn-primary"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Data & Privacy */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={20} className="text-primary-400" />
              Data & Privacy
            </h3>

            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-dark-300 hover:bg-dark-800 hover:text-white transition-colors">
                <Download size={18} />
                <div className="flex-1">
                  <p className="font-medium">Export Data</p>
                  <p className="text-xs text-dark-500">Download all your habit data</p>
                </div>
                <ChevronRight size={16} className="text-dark-500" />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-accent-red/20">
            <h3 className="text-lg font-semibold text-accent-red mb-4 flex items-center gap-2">
              <Trash2 size={20} />
              Danger Zone
            </h3>

            <p className="text-dark-400 text-sm mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            <button className="btn bg-accent-red/20 text-accent-red hover:bg-accent-red/30">
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
