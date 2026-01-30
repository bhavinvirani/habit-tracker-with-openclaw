import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Habit, HABIT_COLORS, HABIT_CATEGORIES } from '../../types';
import clsx from 'clsx';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Habit>) => void;
  habit?: Habit | null;
  isLoading?: boolean;
}

const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSubmit, habit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    frequency: habit?.frequency || 'daily',
    color: habit?.color || HABIT_COLORS[0].value,
    category: habit?.category || '',
    goal: habit?.goal || 1,
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  React.useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        description: habit.description || '',
        frequency: habit.frequency,
        color: habit.color,
        category: habit.category || '',
        goal: habit.goal || 1,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        frequency: 'daily',
        color: HABIT_COLORS[0].value,
        category: '',
        goal: 1,
      });
    }
    setErrors({});
  }, [habit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrors({ name: 'Habit name is required' });
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      frequency: formData.frequency as Habit['frequency'],
      color: formData.color,
      category: formData.category || undefined,
      goal: formData.goal,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-white">
            {habit ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="label">Habit Name *</label>
            <input
              type="text"
              className={clsx('input', errors.name && 'input-error')}
              placeholder="e.g., Morning Meditation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
            {errors.name && <p className="text-accent-red text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Add details about your habit..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  className={clsx(
                    'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all capitalize',
                    formData.frequency === freq
                      ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                      : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-500'
                  )}
                  onClick={() => setFormData({ ...formData, frequency: freq })}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select category...</option>
              {HABIT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {HABIT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={clsx(
                    'w-9 h-9 rounded-lg transition-all',
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-dark-850 ring-white scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="label">Daily Goal</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFormData({ ...formData, goal: Math.max(1, formData.goal - 1) })}
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-12 text-center">
                {formData.goal}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFormData({ ...formData, goal: formData.goal + 1 })}
              >
                +
              </button>
              <span className="text-dark-400 text-sm ml-2">times per day</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : habit ? (
                'Save Changes'
              ) : (
                <>
                  <Plus size={18} />
                  Create Habit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;
