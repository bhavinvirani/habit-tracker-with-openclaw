import React, { useState } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { analyticsApi, trackingApi } from '../services/habits';
import api from '../services/api';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
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

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await api.patch('/users/profile', data);
      return response.data.data.user;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Update auth store
      const { login } = useAuthStore.getState();
      const { token } = useAuthStore.getState();
      if (token) {
        login(updatedUser, token);
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

  const recentMilestones = milestones?.slice(0, 5) || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-dark-400 mt-1">Manage your account and view achievements</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 card">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            <div className="flex-1">
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
                      className="btn btn-primary"
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
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                    <button onClick={() => setIsEditing(true)} className="btn btn-ghost text-sm">
                      Edit Profile
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-dark-400">
                      <Mail size={16} />
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-dark-400">
                      <Calendar size={16} />
                      <span>
                        Joined{' '}
                        {user?.createdAt
                          ? format(new Date(user.createdAt), 'MMMM d, yyyy')
                          : 'Recently'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-700">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-accent-orange mb-1">
                <Flame size={20} />
                <span className="text-2xl font-bold">{stats?.currentBestStreak || 0}</span>
              </div>
              <p className="text-xs text-dark-400">Current Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-accent-green mb-1">
                <Trophy size={20} />
                <span className="text-2xl font-bold">{stats?.longestEverStreak || 0}</span>
              </div>
              <p className="text-xs text-dark-400">Best Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary-400 mb-1">
                <Target size={20} />
                <span className="text-2xl font-bold">{stats?.monthlyCompletionRate || 0}%</span>
              </div>
              <p className="text-xs text-dark-400">Avg. Completion</p>
            </div>
          </div>
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
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-dark-700">
            <div className="flex items-center gap-2 text-dark-500 text-xs">
              <Shield size={14} />
              <span>Your data is securely stored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-accent-yellow" />
          <h3 className="text-lg font-semibold text-white">Recent Milestones</h3>
        </div>

        {recentMilestones.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMilestones.map(
              (milestone: {
                id: string;
                streak: number;
                achievedAt: string;
                habit: { name: string; color: string };
              }) => (
                <div
                  key={milestone.id}
                  className="p-4 rounded-lg bg-dark-800 border border-dark-700"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${milestone.habit.color}20` }}
                    >
                      <Flame size={20} style={{ color: milestone.habit.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{milestone.streak} days</p>
                      <p className="text-xs text-dark-400">{milestone.habit.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-dark-500">
                    Achieved {format(new Date(milestone.achievedAt), 'MMM d, yyyy')}
                  </p>
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
  );
};

export default Profile;
