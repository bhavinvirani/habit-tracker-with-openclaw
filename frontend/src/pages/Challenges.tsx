import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trophy,
  Pencil,
  Trash2,
  X,
  Flame,
  Target,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Zap,
  Award,
  ChevronRight,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import clsx from 'clsx';
import {
  CHALLENGE_STATUS_CONFIG,
  DURATION_PRESETS,
  type ChallengeStatus,
} from '../constants/status';
import { CircularProgress } from '../components/ui';

interface ChallengeHabit {
  id: string;
  name: string;
  icon: string | null;
  color: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  completionRate: number | null;
  habits: ChallengeHabit[];
  daysElapsed: number;
  daysRemaining: number;
  progressPercentage: number;
  createdAt: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string | null;
  color: string;
}

// API functions
const challengesApi = {
  getAll: async (params?: {
    status?: ChallengeStatus;
    includeCompleted?: boolean;
  }): Promise<Challenge[]> => {
    const response = await api.get('/challenges', {
      params: { ...params, includeCompleted: true },
    });
    return response.data.data.challenges;
  },
  getById: async (id: string): Promise<Challenge> => {
    const response = await api.get(`/challenges/${id}`);
    return response.data.data;
  },
  create: async (data: {
    name: string;
    description?: string;
    duration: number;
    startDate: string;
    habitIds: string[];
  }): Promise<Challenge> => {
    const response = await api.post('/challenges', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<Challenge>): Promise<Challenge> => {
    const response = await api.patch(`/challenges/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/challenges/${id}`);
  },
  sync: async (id: string): Promise<void> => {
    await api.post(`/challenges/${id}/sync`);
  },
};

const Challenges: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [filterStatus, setFilterStatus] = useState<ChallengeStatus | 'ALL'>('ALL');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    habitIds: [] as string[],
  });

  // Fetch challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getAll(),
  });

  // Fetch habits for selection
  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await api.get('/habits');
      return response.data.data.habits as Habit[];
    },
  });

  const habits = habitsData || [];

  // Create challenge
  const createMutation = useMutation({
    mutationFn: challengesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setIsModalOpen(false);
      resetForm();
      toast.success("Challenge created! Let's go! 🔥");
    },
    onError: () => toast.error('Failed to create challenge'),
  });

  // Update challenge
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Challenge> }) =>
      challengesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setIsModalOpen(false);
      setEditingChallenge(null);
      resetForm();
      toast.success('Challenge updated!');
    },
    onError: () => toast.error('Failed to update challenge'),
  });

  // Delete challenge
  const deleteMutation = useMutation({
    mutationFn: challengesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setIsDetailOpen(false);
      setSelectedChallenge(null);
      toast.success('Challenge removed');
    },
    onError: () => toast.error('Failed to remove challenge'),
  });

  // Sync progress
  const syncMutation = useMutation({
    mutationFn: challengesApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Progress synced!');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 30,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      habitIds: [],
    });
  };

  const handleOpenModal = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setFormData({
        name: challenge.name,
        description: challenge.description || '',
        duration: challenge.duration,
        startDate: challenge.startDate.split('T')[0],
        habitIds: challenge.habits.map((h) => h.id),
      });
    } else {
      setEditingChallenge(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleOpenDetail = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsDetailOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.habitIds.length === 0) {
      toast.error('Please select at least one habit');
      return;
    }

    if (editingChallenge) {
      updateMutation.mutate({
        id: editingChallenge.id,
        data: { name: formData.name, description: formData.description || undefined },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this challenge?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleHabitSelection = (habitId: string) => {
    setFormData((prev) => ({
      ...prev,
      habitIds: prev.habitIds.includes(habitId)
        ? prev.habitIds.filter((id) => id !== habitId)
        : [...prev.habitIds, habitId],
    }));
  };

  // Filter challenges
  const filteredChallenges = useMemo(() => {
    if (filterStatus === 'ALL') return challenges;
    return challenges.filter((c) => c.status === filterStatus);
  }, [challenges, filterStatus]);

  // Group challenges
  const groupedChallenges = useMemo(() => {
    return {
      ACTIVE: challenges.filter((c) => c.status === 'ACTIVE'),
      COMPLETED: challenges.filter((c) => c.status === 'COMPLETED'),
      FAILED: challenges.filter((c) => c.status === 'FAILED'),
      CANCELLED: challenges.filter((c) => c.status === 'CANCELLED'),
    };
  }, [challenges]);

  // Stats
  const stats = useMemo(() => {
    const active = groupedChallenges.ACTIVE.length;
    const completed = groupedChallenges.COMPLETED.length;
    const total = challenges.length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgCompletionRate =
      groupedChallenges.COMPLETED.length > 0
        ? Math.round(
            groupedChallenges.COMPLETED.reduce((sum, c) => sum + (c.completionRate || 0), 0) /
              groupedChallenges.COMPLETED.length
          )
        : 0;

    return { active, completed, total, successRate, avgCompletionRate };
  }, [challenges, groupedChallenges]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-accent-green to-accent-green/70';
    if (percentage >= 50) return 'from-primary-500 to-primary-400';
    if (percentage >= 25) return 'from-accent-yellow to-accent-orange';
    return 'from-accent-red to-accent-red/70';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Challenges</h1>
          <p className="text-dark-400 mt-1">Push yourself to new heights</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          New Challenge
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-600/20 to-primary-600/5 border-primary-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Flame size={20} className="text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-dark-400">Active</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-green/20 to-accent-green/5 border-accent-green/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-green/20">
              <Trophy size={20} className="text-accent-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-xs text-dark-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-yellow/20">
              <TrendingUp size={20} className="text-accent-yellow" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
              <p className="text-xs text-dark-400">Success Rate</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dark-700">
              <BarChart3 size={20} className="text-dark-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgCompletionRate}%</p>
              <p className="text-xs text-dark-400">Avg Completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
            filterStatus === 'ALL'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
          )}
        >
          All ({challenges.length})
        </button>
        {(Object.keys(CHALLENGE_STATUS_CONFIG) as ChallengeStatus[]).map((status) => {
          const config = CHALLENGE_STATUS_CONFIG[status];
          const count = groupedChallenges[status].length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                filterStatus === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
              )}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Active Challenges - Featured */}
      {groupedChallenges.ACTIVE.length > 0 && filterStatus === 'ALL' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Flame size={20} className="text-accent-orange" />
            Active Challenges
          </h2>
          <div className="grid gap-4">
            {groupedChallenges.ACTIVE.map((challenge) => {
              const progressColor = getProgressColor(challenge.progressPercentage);
              return (
                <div
                  key={challenge.id}
                  className="card-hover cursor-pointer"
                  onClick={() => handleOpenDetail(challenge)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-lg">{challenge.name}</h3>
                        <span
                          className={clsx(
                            'badge',
                            CHALLENGE_STATUS_CONFIG.ACTIVE.bgColor,
                            CHALLENGE_STATUS_CONFIG.ACTIVE.color
                          )}
                        >
                          Day {challenge.daysElapsed} of {challenge.duration}
                        </span>
                      </div>
                      {challenge.description && (
                        <p className="text-sm text-dark-400 line-clamp-1">
                          {challenge.description}
                        </p>
                      )}
                      {/* Linked Habits */}
                      <div className="flex items-center gap-2 mt-3">
                        {challenge.habits.slice(0, 4).map((habit) => (
                          <div
                            key={habit.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-700"
                            title={habit.name}
                          >
                            <span>{habit.icon || '📌'}</span>
                            <span className="text-xs text-dark-300 max-w-[80px] truncate">
                              {habit.name}
                            </span>
                          </div>
                        ))}
                        {challenge.habits.length > 4 && (
                          <span className="text-xs text-dark-500">
                            +{challenge.habits.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-dark-500" />
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-dark-800/50">
                      <p className="text-2xl font-bold text-white">{challenge.daysElapsed}</p>
                      <p className="text-xs text-dark-500">Days In</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-dark-800/50">
                      <p className="text-2xl font-bold text-primary-400">
                        {challenge.daysRemaining}
                      </p>
                      <p className="text-xs text-dark-500">Days Left</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-dark-800/50">
                      <p className="text-2xl font-bold text-accent-yellow">
                        {challenge.progressPercentage}%
                      </p>
                      <p className="text-xs text-dark-500">Progress</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full bg-gradient-to-r transition-all', progressColor)}
                        style={{ width: `${challenge.progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-dark-500 mt-1">
                      <span>{format(parseISO(challenge.startDate), 'MMM d')}</span>
                      <span>{format(parseISO(challenge.endDate), 'MMM d')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Challenges / Filtered List */}
      {(filterStatus !== 'ALL'
        ? filteredChallenges
        : [
            ...groupedChallenges.COMPLETED,
            ...groupedChallenges.FAILED,
            ...groupedChallenges.CANCELLED,
          ]
      ).length > 0 && (
        <div>
          {filterStatus === 'ALL' && groupedChallenges.ACTIVE.length > 0 && (
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award size={20} className="text-dark-400" />
              Past Challenges
            </h2>
          )}
          <div className="grid gap-3">
            {(filterStatus !== 'ALL'
              ? filteredChallenges
              : [
                  ...groupedChallenges.COMPLETED,
                  ...groupedChallenges.FAILED,
                  ...groupedChallenges.CANCELLED,
                ]
            ).map((challenge) => {
              const config = CHALLENGE_STATUS_CONFIG[challenge.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={challenge.id}
                  className="card flex items-center gap-4 cursor-pointer hover:bg-dark-750 transition-colors"
                  onClick={() => handleOpenDetail(challenge)}
                >
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      config.bgColor
                    )}
                  >
                    <StatusIcon size={24} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{challenge.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <span>{challenge.duration} days</span>
                      <span>•</span>
                      <span>
                        {challenge.habits.length} habit{challenge.habits.length !== 1 ? 's' : ''}
                      </span>
                      {challenge.completionRate !== null && (
                        <>
                          <span>•</span>
                          <span>{Math.round(challenge.completionRate)}% completion</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={clsx('badge', config.bgColor, config.color)}>
                    {config.label}
                  </span>
                  <ChevronRight size={18} className="text-dark-500" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Ready for a challenge?</h3>
          <p className="text-dark-400 mb-6 max-w-md mx-auto">
            Challenges help you stay focused and build lasting habits. Set a goal, pick your habits,
            and start your journey!
          </p>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Zap size={18} />
            Create Your First Challenge
          </button>
        </div>
      )}

      {/* Challenge Detail Slide-over */}
      {isDetailOpen && selectedChallenge && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="ml-auto w-full max-w-lg bg-dark-800 border-l border-dark-700 h-full overflow-y-auto relative animate-slide-in-right">
            {/* Close Button */}
            <button
              onClick={() => setIsDetailOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-dark-700 text-dark-400 hover:text-white z-10"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={clsx(
                    'p-3 rounded-xl',
                    CHALLENGE_STATUS_CONFIG[selectedChallenge.status].bgColor
                  )}
                >
                  {React.createElement(CHALLENGE_STATUS_CONFIG[selectedChallenge.status].icon, {
                    size: 24,
                    className: CHALLENGE_STATUS_CONFIG[selectedChallenge.status].color,
                  })}
                </div>
                <div>
                  <span
                    className={clsx(
                      'badge mb-1',
                      CHALLENGE_STATUS_CONFIG[selectedChallenge.status].bgColor,
                      CHALLENGE_STATUS_CONFIG[selectedChallenge.status].color
                    )}
                  >
                    {CHALLENGE_STATUS_CONFIG[selectedChallenge.status].label}
                  </span>
                  <h2 className="text-xl font-bold text-white">{selectedChallenge.name}</h2>
                </div>
              </div>
              {selectedChallenge.description && (
                <p className="text-dark-400">{selectedChallenge.description}</p>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Progress for Active */}
              {selectedChallenge.status === 'ACTIVE' && (
                <div className="card bg-dark-900/50">
                  <h3 className="font-medium text-white mb-4">Progress</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">
                        {selectedChallenge.daysElapsed}
                      </p>
                      <p className="text-xs text-dark-500">Days In</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary-400">
                        {selectedChallenge.daysRemaining}
                      </p>
                      <p className="text-xs text-dark-500">Days Left</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-accent-yellow">
                        {selectedChallenge.progressPercentage}%
                      </p>
                      <p className="text-xs text-dark-500">Complete</p>
                    </div>
                  </div>
                  <div className="h-4 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full bg-gradient-to-r transition-all',
                        getProgressColor(selectedChallenge.progressPercentage)
                      )}
                      style={{ width: `${selectedChallenge.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completion Rate for Finished */}
              {selectedChallenge.completionRate !== null && (
                <div className="card bg-dark-900/50">
                  <h3 className="font-medium text-white mb-3">Final Results</h3>
                  <div className="flex items-center gap-4">
                    <CircularProgress
                      percent={selectedChallenge.completionRate}
                      size={80}
                      gradientColors={
                        selectedChallenge.completionRate >= 80
                          ? ['#22c55e', '#22c55e']
                          : selectedChallenge.completionRate >= 50
                            ? ['#6366f1', '#8b5cf6']
                            : ['#ef4444', '#ef4444']
                      }
                      gradientId={`final-results-${selectedChallenge.id}`}
                    />
                    <div>
                      <p className="text-white font-medium">
                        {selectedChallenge.completionRate >= 80
                          ? 'Excellent! 🎉'
                          : selectedChallenge.completionRate >= 50
                            ? 'Good effort! 💪'
                            : 'Keep trying! 🌱'}
                      </p>
                      <p className="text-sm text-dark-400">
                        Completed {selectedChallenge.duration} day challenge
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-dark-900/50">
                  <Calendar size={18} className="text-dark-400 mb-1" />
                  <p className="text-lg font-semibold text-white">
                    {format(parseISO(selectedChallenge.startDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-dark-500">Started</p>
                </div>
                <div className="card bg-dark-900/50">
                  <Target size={18} className="text-dark-400 mb-1" />
                  <p className="text-lg font-semibold text-white">
                    {format(parseISO(selectedChallenge.endDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-dark-500">End Date</p>
                </div>
              </div>

              {/* Linked Habits */}
              <div>
                <h3 className="font-medium text-white mb-3">Linked Habits</h3>
                <div className="space-y-2">
                  {selectedChallenge.habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-900/50"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${habit.color}20` }}
                      >
                        {habit.icon || '📌'}
                      </div>
                      <span className="text-white">{habit.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-dark-700">
                {selectedChallenge.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      syncMutation.mutate(selectedChallenge.id);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    <CheckCircle2 size={16} />
                    Sync Progress
                  </button>
                )}
                <button
                  onClick={() => {
                    handleOpenModal(selectedChallenge);
                    setIsDetailOpen(false);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedChallenge.id)}
                  className="btn bg-accent-red/20 text-accent-red hover:bg-accent-red/30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingChallenge ? 'Edit Challenge' : 'New Challenge'}
                </h2>
                <p className="text-sm text-dark-400 mt-1">Set a goal and commit to it</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="label">Challenge Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., 30-Day Morning Routine"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder="What's this challenge about?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Duration */}
              {!editingChallenge && (
                <div>
                  <label className="label">Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration: preset.value })}
                        className={clsx(
                          'p-3 rounded-lg border-2 transition-all text-left',
                          formData.duration === preset.value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                        )}
                      >
                        <p className="font-medium text-white">{preset.label}</p>
                        <p className="text-xs text-dark-400 mt-0.5">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Date */}
              {!editingChallenge && (
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    Ends:{' '}
                    {format(
                      addDays(parseISO(formData.startDate), formData.duration),
                      'MMMM d, yyyy'
                    )}
                  </p>
                </div>
              )}

              {/* Habits Selection */}
              {!editingChallenge && (
                <div>
                  <label className="label">Select Habits *</label>
                  <p className="text-xs text-dark-400 mb-3">
                    Choose the habits to include in this challenge
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {habits.length === 0 ? (
                      <p className="text-center text-dark-400 py-4">
                        No habits found. Create some habits first!
                      </p>
                    ) : (
                      habits.map((habit) => (
                        <button
                          key={habit.id}
                          type="button"
                          onClick={() => toggleHabitSelection(habit.id)}
                          className={clsx(
                            'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                            formData.habitIds.includes(habit.id)
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-dark-600 hover:border-dark-500'
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${habit.color}20` }}
                          >
                            {habit.icon || '📌'}
                          </div>
                          <span className="text-white flex-1 text-left">{habit.name}</span>
                          {formData.habitIds.includes(habit.id) && (
                            <CheckCircle2 size={18} className="text-primary-400" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  {formData.habitIds.length > 0 && (
                    <p className="text-xs text-primary-400 mt-2">
                      {formData.habitIds.length} habit{formData.habitIds.length !== 1 ? 's' : ''}{' '}
                      selected
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  <Zap size={18} />
                  {editingChallenge ? 'Save Changes' : 'Start Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Challenges;
