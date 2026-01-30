import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Flame,
  Archive,
  MoreVertical,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { habitsApi } from '../services/habits';
import { Habit, HabitWithStats } from '../types';
import HabitModal from '../components/habits/HabitModal';

const Habits: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Fetch habits
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: habitsApi.getAll,
  });

  // Create habit
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

  // Update habit
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) => habitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      setIsModalOpen(false);
      setEditingHabit(null);
      toast.success('Habit updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update habit');
    },
  });

  // Delete habit
  const deleteMutation = useMutation({
    mutationFn: habitsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      toast.success('Habit deleted');
    },
    onError: () => {
      toast.error('Failed to delete habit');
    },
  });

  // Archive habit
  const archiveMutation = useMutation({
    mutationFn: habitsApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      toast.success('Habit archived');
    },
    onError: () => {
      toast.error('Failed to archive habit');
    },
  });

  // Unarchive habit
  const unarchiveMutation = useMutation({
    mutationFn: habitsApi.unarchive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      toast.success('Habit restored');
    },
    onError: () => {
      toast.error('Failed to restore habit');
    },
  });

  const handleSubmit = (data: Partial<Habit>) => {
    if (editingHabit) {
      updateMutation.mutate({ id: editingHabit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (habit: HabitWithStats) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
    setActiveMenu(null);
  };

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
    setActiveMenu(null);
  };

  const handleUnarchive = (id: string) => {
    unarchiveMutation.mutate(id);
    setActiveMenu(null);
  };

  const activeHabits = habits.filter((h) => !h.isArchived);
  const archivedHabits = habits.filter((h) => h.isArchived);

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
          <h1 className="text-3xl font-bold text-white">My Habits</h1>
          <p className="text-dark-400 mt-1">
            {activeHabits.length} active habit{activeHabits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          New Habit
        </button>
      </div>

      {/* Habits List */}
      {activeHabits.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 mb-6">
            <Sparkles className="w-10 h-10 text-dark-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No habits yet</h3>
          <p className="text-dark-400 mb-6 max-w-md mx-auto">
            Start building better habits today. Create your first habit to begin tracking your
            progress.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={18} />
            Create Your First Habit
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeHabits.map((habit) => (
            <div key={habit.id} className="card-hover flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${habit.color}20` }}
              >
                <CheckCircle2 size={24} style={{ color: habit.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{habit.name}</h3>
                {habit.description && (
                  <p className="text-sm text-dark-400 truncate">{habit.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="badge badge-primary">
                    {habit.frequency.charAt(0) + habit.frequency.slice(1).toLowerCase()}
                  </span>
                  {habit.category && (
                    <span className="text-xs text-dark-500">{habit.category}</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-accent-orange">
                    <Flame size={16} />
                    <span className="font-bold">{habit.currentStreak}</span>
                  </div>
                  <span className="text-xs text-dark-500">Current</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-accent-green">
                    <TrendingUp size={16} />
                    <span className="font-bold">{habit.longestStreak}</span>
                  </div>
                  <span className="text-xs text-dark-500">Best</span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-primary-400">
                    {Math.round(habit.completionRate || 0)}%
                  </span>
                  <p className="text-xs text-dark-500">Rate</p>
                </div>
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === habit.id ? null : habit.id)}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <MoreVertical size={20} />
                </button>

                {activeMenu === habit.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-20 overflow-hidden">
                      <button
                        onClick={() => handleEdit(habit)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                      >
                        <Pencil size={16} />
                        Edit Habit
                      </button>
                      <button
                        onClick={() => handleArchive(habit.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                      >
                        <Archive size={16} />
                        Archive
                      </button>
                      <button
                        onClick={() => handleDelete(habit.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-red hover:bg-dark-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archived Section */}
      {archivedHabits.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors mb-4"
          >
            <Archive size={18} />
            <span>Archived ({archivedHabits.length})</span>
          </button>

          {showArchived && (
            <div className="grid gap-3 opacity-60">
              {archivedHabits.map((habit) => (
                <div key={habit.id} className="card flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${habit.color}20` }}
                  >
                    <Archive size={18} style={{ color: habit.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-dark-300">{habit.name}</h3>
                  </div>
                  <button
                    onClick={() => handleUnarchive(habit.id)}
                    className="btn btn-ghost text-sm"
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleSubmit}
        habit={editingHabit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default Habits;
