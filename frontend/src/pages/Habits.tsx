import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Flame,
  Archive,
  MoreVertical,
  Pencil,
  Trash2,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronRight,
  Calendar,
  Target,
  Zap,
  LayoutGrid,
  List,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { habitsApi, analyticsApi } from '../services/habits';
import { Habit, HabitWithStats } from '../types';
import HabitModal from '../components/habits/HabitModal';
import { LoadingSpinner, Sparkline, CategoryBadge } from '../components/ui';

const Habits: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // New state for filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Fetch habits
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: habitsApi.getAll,
  });

  // Fetch weekly data for sparklines
  const { data: weeklyData } = useQuery({
    queryKey: ['weekly'],
    queryFn: () => analyticsApi.getWeekly(),
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

  // Get unique categories from habits
  const categories = useMemo(() => {
    const cats = new Set<string>();
    habits.forEach((h) => {
      if (h.category) cats.add(h.category);
    });
    return Array.from(cats).sort();
  }, [habits]);

  // Filter and group habits
  const { activeHabits, archivedHabits, groupedHabits } = useMemo(() => {
    let filtered = habits.filter((h) => !h.isArchived);
    const archived = habits.filter((h) => h.isArchived);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.description?.toLowerCase().includes(query) ||
          h.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((h) => h.category === selectedCategory);
    }

    // Apply frequency filter
    if (selectedFrequency) {
      filtered = filtered.filter((h) => h.frequency === selectedFrequency);
    }

    // Group by category
    const grouped: Record<string, HabitWithStats[]> = {};
    filtered.forEach((h) => {
      const cat = h.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(h);
    });

    // Sort categories and habits within
    const sortedGrouped: Record<string, HabitWithStats[]> = {};
    Object.keys(grouped)
      .sort()
      .forEach((key) => {
        sortedGrouped[key] = grouped[key].sort(
          (a, b) => (b.currentStreak || 0) - (a.currentStreak || 0)
        );
      });

    return { activeHabits: filtered, archivedHabits: archived, groupedHabits: sortedGrouped };
  }, [habits, searchQuery, selectedCategory, selectedFrequency]);

  // Generate sparkline data for a habit (last 7 days)
  const getSparklineData = (habitId: string): boolean[] => {
    if (!weeklyData?.days) return Array(7).fill(false);

    return weeklyData.days.map((day) => {
      const habitLog = day.habits?.find((h) => h.id === habitId);
      return habitLog?.completed || false;
    });
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedFrequency(null);
  };

  const hasFilters = searchQuery || selectedCategory || selectedFrequency;

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const renderHabitCard = (habit: HabitWithStats, isGrid = false) => (
    <div
      key={habit.id}
      className={clsx(
        'card-hover transition-all duration-200',
        isGrid ? 'flex flex-col gap-3 p-4' : 'flex items-center gap-4'
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          'rounded-xl flex items-center justify-center flex-shrink-0',
          isGrid ? 'w-14 h-14' : 'w-12 h-12'
        )}
        style={{ backgroundColor: `${habit.color}20` }}
      >
        {habit.icon ? (
          <span className="text-2xl">{habit.icon}</span>
        ) : (
          <CheckCircle2 size={isGrid ? 28 : 24} style={{ color: habit.color }} />
        )}
      </div>

      {/* Content */}
      <div className={clsx('flex-1 min-w-0', isGrid && 'space-y-2')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white">{habit.name}</h3>
            {habit.description && (
              <p className="text-sm text-dark-400 truncate max-w-[200px]">{habit.description}</p>
            )}
          </div>
          {!isGrid && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Sparkline data={getSparklineData(habit.id)} color={habit.color} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="badge badge-primary text-xs">
            {habit.frequency.charAt(0) + habit.frequency.slice(1).toLowerCase()}
          </span>
          {habit.category && <CategoryBadge category={habit.category} />}
        </div>

        {isGrid && (
          <div className="mt-2">
            <Sparkline data={getSparklineData(habit.id)} color={habit.color} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        className={clsx(
          isGrid
            ? 'flex justify-between pt-3 border-t border-dark-700'
            : 'hidden sm:flex items-center gap-6'
        )}
      >
        <div className="text-center">
          <div className="flex items-center gap-1 text-accent-orange">
            <Flame size={16} />
            <span className="font-bold">{habit.currentStreak}</span>
          </div>
          <span className="text-xs text-dark-500">Streak</span>
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
        <div className="text-center">
          <span className="font-bold text-dark-300">{habit.totalCompletions || 0}</span>
          <p className="text-xs text-dark-500">Total</p>
        </div>
      </div>

      {/* Menu */}
      <div className={clsx('relative', isGrid && 'absolute top-3 right-3')}>
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
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Habits</h1>
          <p className="text-dark-400 mt-1">
            {activeHabits.length} active habit{activeHabits.length !== 1 ? 's' : ''}
            {hasFilters && ` (filtered from ${habits.filter((h) => !h.isArchived).length})`}
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

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-accent-orange/20 to-transparent">
          <div className="flex items-center gap-3">
            <Flame className="text-accent-orange" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.max(...habits.map((h) => h.currentStreak || 0), 0)}
              </p>
              <p className="text-xs text-dark-400">Best Streak</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-green/20 to-transparent">
          <div className="flex items-center gap-3">
            <Target className="text-accent-green" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">
                {habits.reduce((sum, h) => sum + (h.totalCompletions || 0), 0)}
              </p>
              <p className="text-xs text-dark-400">Total Done</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-primary-500/20 to-transparent">
          <div className="flex items-center gap-3">
            <Zap className="text-primary-400" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
              <p className="text-xs text-dark-400">Categories</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-purple/20 to-transparent">
          <div className="flex items-center gap-3">
            <Calendar className="text-accent-purple" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">
                {habits.filter((h) => h.frequency === 'DAILY' && !h.isArchived).length}
              </p>
              <p className="text-xs text-dark-400">Daily Habits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="input pr-8 appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
            />
          </div>

          {/* Frequency Filter */}
          <div className="relative">
            <select
              value={selectedFrequency || ''}
              onChange={(e) => setSelectedFrequency(e.target.value || null)}
              className="input pr-8 appearance-none cursor-pointer"
            >
              <option value="">All Frequencies</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <Calendar
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'
              )}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'
              )}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          {/* Group Toggle */}
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={clsx('btn btn-ghost text-sm', groupByCategory && 'bg-dark-700')}
          >
            Group by Category
          </button>

          {/* Clear Filters */}
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-ghost text-sm text-accent-red">
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Habits List */}
      {activeHabits.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 mb-6">
            <Sparkles className="w-10 h-10 text-dark-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasFilters ? 'No habits match your filters' : 'No habits yet'}
          </h3>
          <p className="text-dark-400 mb-6 max-w-md mx-auto">
            {hasFilters
              ? 'Try adjusting your filters or search query.'
              : 'Start building better habits today. Create your first habit to begin tracking your progress.'}
          </p>
          {hasFilters ? (
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={18} />
              Create Your First Habit
            </button>
          )}
        </div>
      ) : groupByCategory ? (
        // Grouped View
        <div className="space-y-4">
          {Object.entries(groupedHabits).map(([category, categoryHabits]) => (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-2 w-full text-left group"
              >
                {collapsedCategories.has(category) ? (
                  <ChevronRight
                    size={20}
                    className="text-dark-500 group-hover:text-white transition-colors"
                  />
                ) : (
                  <ChevronDown
                    size={20}
                    className="text-dark-500 group-hover:text-white transition-colors"
                  />
                )}
                <h2 className="text-lg font-semibold text-white">{category}</h2>
                <span className="text-sm text-dark-500">({categoryHabits.length})</span>
              </button>

              {/* Category Habits */}
              {!collapsedCategories.has(category) && (
                <div
                  className={clsx(
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-6'
                      : 'grid gap-3 ml-6'
                  )}
                >
                  {categoryHabits.map((habit) => renderHabitCard(habit, viewMode === 'grid'))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Flat View
        <div
          className={clsx(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'grid gap-4'
          )}
        >
          {activeHabits.map((habit) => renderHabitCard(habit, viewMode === 'grid'))}
        </div>
      )}

      {/* Archived Section */}
      {archivedHabits.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors mb-4"
          >
            {showArchived ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
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
                    {habit.icon ? (
                      <span className="text-lg">{habit.icon}</span>
                    ) : (
                      <Archive size={18} style={{ color: habit.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-dark-300">{habit.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-dark-500">
                        {habit.totalCompletions || 0} completions • {habit.longestStreak} day best
                      </span>
                      {habit.category && (
                        <span className="text-xs text-dark-500">• {habit.category}</span>
                      )}
                    </div>
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
