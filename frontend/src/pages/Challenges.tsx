import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trophy,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import clsx from 'clsx';

interface Challenge {
  id: string;
  name: string;
  description?: string;
  habitId: string;
  targetDays: number;
  startDate: string;
  endDate: string;
  completedDays: number;
  status: 'active' | 'completed' | 'failed' | 'upcoming';
  habit?: {
    name: string;
    color: string;
  };
}

// API functions
const challengesApi = {
  getAll: async (): Promise<Challenge[]> => {
    const response = await api.get('/challenges');
    return response.data.data.challenges;
  },
  create: async (challenge: Partial<Challenge>): Promise<Challenge> => {
    const response = await api.post('/challenges', challenge);
    return response.data.data.challenge;
  },
  update: async (id: string, challenge: Partial<Challenge>): Promise<Challenge> => {
    const response = await api.patch(`/challenges/${id}`, challenge);
    return response.data.data.challenge;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/challenges/${id}`);
  },
  sync: async (id: string): Promise<Challenge> => {
    const response = await api.post(`/challenges/${id}/sync`);
    return response.data.data.challenge;
  },
};

const Challenges: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Fetch challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: challengesApi.getAll,
  });

  // Fetch habits for dropdown
  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await api.get('/habits');
      return response.data.data.habits;
    },
  });

  const habits = habitsData || [];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    habitId: '',
    targetDays: 30,
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Create challenge
  const createMutation = useMutation({
    mutationFn: challengesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Challenge created!');
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
      toast.success('Challenge removed');
    },
    onError: () => toast.error('Failed to remove challenge'),
  });

  // Sync challenge
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
      habitId: '',
      targetDays: 30,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleOpenModal = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setFormData({
        name: challenge.name,
        description: challenge.description || '',
        habitId: challenge.habitId,
        targetDays: challenge.targetDays,
        startDate: challenge.startDate.split('T')[0],
      });
    } else {
      setEditingChallenge(null);
      resetForm();
    }
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this challenge?')) {
      deleteMutation.mutate(id);
    }
    setActiveMenu(null);
  };

  const getStatusBadge = (status: Challenge['status']) => {
    switch (status) {
      case 'active':
        return { color: 'bg-primary-500/20 text-primary-400', label: 'Active' };
      case 'completed':
        return { color: 'bg-accent-green/20 text-accent-green', label: 'Completed' };
      case 'failed':
        return { color: 'bg-accent-red/20 text-accent-red', label: 'Failed' };
      case 'upcoming':
        return { color: 'bg-accent-yellow/20 text-accent-yellow', label: 'Upcoming' };
      default:
        return { color: 'bg-dark-700 text-dark-400', label: status };
    }
  };

  const activeChallenges = challenges.filter((c) => c.status === 'active');
  const completedChallenges = challenges.filter((c) => c.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Challenges</h1>
          <p className="text-dark-400 mt-1">Set goals and track your progress</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          New Challenge
        </button>
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="text-accent-orange" size={20} />
            Active Challenges
          </h2>
          <div className="grid gap-4">
            {activeChallenges.map((challenge) => {
              const progress = Math.round((challenge.completedDays / challenge.targetDays) * 100);
              const daysLeft = differenceInDays(parseISO(challenge.endDate), new Date());

              return (
                <div key={challenge.id} className="card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{challenge.name}</h3>
                      {challenge.description && (
                        <p className="text-sm text-dark-400 mt-1">{challenge.description}</p>
                      )}
                      {challenge.habit && (
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: challenge.habit.color }}
                          />
                          <span className="text-sm text-dark-400">{challenge.habit.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenu(activeMenu === challenge.id ? null : challenge.id)
                        }
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {activeMenu === challenge.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-20 overflow-hidden">
                            <button
                              onClick={() => {
                                syncMutation.mutate(challenge.id);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-200 hover:bg-dark-700"
                            >
                              <CheckCircle2 size={16} />
                              Sync Progress
                            </button>
                            <button
                              onClick={() => handleOpenModal(challenge)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-200 hover:bg-dark-700"
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(challenge.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-red hover:bg-dark-700"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-dark-800">
                      <p className="text-2xl font-bold text-white">{challenge.completedDays}</p>
                      <p className="text-xs text-dark-400">Days Done</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-dark-800">
                      <p className="text-2xl font-bold text-primary-400">{challenge.targetDays}</p>
                      <p className="text-xs text-dark-400">Target</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-dark-800">
                      <p className="text-2xl font-bold text-accent-yellow">
                        {Math.max(0, daysLeft)}
                      </p>
                      <p className="text-xs text-dark-400">Days Left</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-dark-400">Progress</span>
                      <span className="text-primary-400">{progress}%</span>
                    </div>
                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="text-accent-yellow" size={20} />
            Completed
          </h2>
          <div className="grid gap-3">
            {completedChallenges.map((challenge) => (
              <div key={challenge.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-green/20 flex items-center justify-center">
                  <Trophy size={24} className="text-accent-green" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{challenge.name}</h3>
                  <p className="text-sm text-dark-400">{challenge.targetDays} days completed</p>
                </div>
                <span className={clsx('badge', getStatusBadge(challenge.status).color)}>
                  {getStatusBadge(challenge.status).label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <div className="card text-center py-16">
          <Trophy className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No challenges yet</h3>
          <p className="text-dark-400 mb-6">Create a challenge to push yourself further</p>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus size={18} />
            Create Your First Challenge
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-xl font-semibold text-white">
                {editingChallenge ? 'Edit Challenge' : 'New Challenge'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Challenge Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., 30-Day Meditation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder="What's this challenge about?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Linked Habit</label>
                <select
                  className="input"
                  value={formData.habitId}
                  onChange={(e) => setFormData({ ...formData, habitId: e.target.value })}
                  required
                >
                  <option value="">Select a habit...</option>
                  {habits.map((habit: any) => (
                    <option key={habit.id} value={habit.id}>
                      {habit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Target Days</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.targetDays}
                    onChange={(e) =>
                      setFormData({ ...formData, targetDays: parseInt(e.target.value) || 30 })
                    }
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingChallenge ? 'Save' : 'Create Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;
