import React, { useState } from 'react';
import { X, Plus, Check, Clock, Hash, Flame, Target, Calendar, Sparkles } from 'lucide-react';
import { Habit, HABIT_COLORS, HABIT_CATEGORIES } from '../../types';
import clsx from 'clsx';

// Emoji icons organized by category
const HABIT_ICONS: Record<string, string[]> = {
  Health: ['💧', '💊', '🥗', '😴', '🦷', '❤️', '🩺', '🧴'],
  Fitness: ['🏃', '🏋️', '🧘', '🚴', '🏊', '⚽', '🎾', '💪'],
  Mindfulness: ['🧘', '📿', '🕯️', '🌅', '✨', '🧠', '💆', '🙏'],
  Productivity: ['📵', '📝', '✅', '📊', '💻', '📅', '⏰', '🎯'],
  Learning: ['📚', '✍️', '🎓', '💡', '🔬', '🎨', '🎵', '🌐'],
  Social: ['📞', '👥', '💬', '🤝', '💌', '🎉', '☕', '🍽️'],
  Finance: ['💰', '💳', '📈', '🏦', '💵', '🧾', '📉', '🪙'],
  Creativity: ['🎨', '✏️', '📷', '🎬', '🎭', '🎹', '🖌️', '💭'],
  Other: ['⭐', '🔥', '💎', '🌟', '🎁', '🏆', '🌈', '🚀'],
};

// Habit types with descriptions
const HABIT_TYPES = [
  {
    value: 'BOOLEAN',
    label: 'Check-off',
    icon: Check,
    description: 'Simple yes/no completion',
    example: 'Drink water, Make bed',
  },
  {
    value: 'NUMERIC',
    label: 'Counter',
    icon: Hash,
    description: 'Track a number goal',
    example: '8 glasses of water, 10,000 steps',
  },
  {
    value: 'DURATION',
    label: 'Duration',
    icon: Clock,
    description: 'Track time spent',
    example: '30 min exercise, 1 hour reading',
  },
];

// Common units for different habit types
const COMMON_UNITS = {
  NUMERIC: ['times', 'glasses', 'pages', 'steps', 'reps', 'sets', 'items'],
  DURATION: ['minutes', 'hours'],
};

// Days of week (ISO 8601: Monday=1, Sunday=7)
const DAYS_OF_WEEK = [
  { short: 'M', full: 'Monday', value: 1 },
  { short: 'T', full: 'Tuesday', value: 2 },
  { short: 'W', full: 'Wednesday', value: 3 },
  { short: 'T', full: 'Thursday', value: 4 },
  { short: 'F', full: 'Friday', value: 5 },
  { short: 'S', full: 'Saturday', value: 6 },
  { short: 'S', full: 'Sunday', value: 7 },
];

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
    frequency: habit?.frequency || 'DAILY',
    color: habit?.color || HABIT_COLORS[0].value,
    category: habit?.category || '',
    icon: habit?.icon || '',
    habitType: habit?.habitType || 'BOOLEAN',
    targetValue: habit?.targetValue || 1,
    unit: habit?.unit || 'times',
    daysOfWeek: habit?.daysOfWeek || [],
  });

  const [errors, setErrors] = useState<{ name?: string }>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [step, setStep] = useState<'basics' | 'details' | 'schedule'>('basics');

  React.useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        description: habit.description || '',
        frequency: habit.frequency,
        color: habit.color,
        category: habit.category || '',
        icon: habit.icon || '',
        habitType: habit.habitType || 'BOOLEAN',
        targetValue: habit.targetValue || 1,
        unit: habit.unit || 'times',
        daysOfWeek: habit.daysOfWeek || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        frequency: 'DAILY',
        color: HABIT_COLORS[0].value,
        category: '',
        icon: '',
        habitType: 'BOOLEAN',
        targetValue: 1,
        unit: 'times',
        daysOfWeek: [],
      });
    }
    setErrors({});
    setStep('basics');
  }, [habit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrors({ name: 'Habit name is required' });
      setStep('basics');
      return;
    }

    // Validate weekly habits have at least one day selected
    if (formData.frequency === 'WEEKLY' && formData.daysOfWeek.length === 0) {
      setErrors({ name: 'Select at least one day for weekly habits' });
      setStep('schedule');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      frequency: formData.frequency as Habit['frequency'],
      color: formData.color,
      category: formData.category || undefined,
      icon: formData.icon || undefined,
      habitType: formData.habitType as Habit['habitType'],
      targetValue: formData.habitType === 'BOOLEAN' ? 1 : formData.targetValue,
      unit: formData.habitType !== 'BOOLEAN' ? formData.unit : undefined,
      daysOfWeek: formData.frequency === 'WEEKLY' ? formData.daysOfWeek : undefined,
    });
  };

  const getIconsForCategory = () => {
    const category = formData.category || 'Other';
    return HABIT_ICONS[category] || HABIT_ICONS.Other;
  };

  const allIcons = Object.values(HABIT_ICONS).flat();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${formData.color}20` }}
            >
              {formData.icon ? (
                <span className="text-xl">{formData.icon}</span>
              ) : (
                <Sparkles size={20} style={{ color: formData.color }} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {habit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <p className="text-sm text-dark-400">
                {formData.name || 'Build a better you, one habit at a time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-dark-700">
          {[
            { id: 'basics', label: 'Basics', icon: Sparkles },
            { id: 'details', label: 'Details', icon: Target },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStep(tab.id as typeof step)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px]',
                step === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-white'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Basics */}
          {step === 'basics' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Name */}
              <div>
                <label className="label">What habit do you want to build? *</label>
                <input
                  type="text"
                  className={clsx('input text-lg', errors.name && 'input-error')}
                  placeholder="e.g., Morning Meditation, Read 30 min"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
                {errors.name && <p className="text-accent-red text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="label">Why is this important? (optional)</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder="Describe your motivation or any details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Category */}
              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {HABIT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat, icon: '' })}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
                        formData.category === cat
                          ? 'bg-primary-600/20 border border-primary-500 text-primary-400'
                          : 'bg-dark-800 border border-dark-600 text-dark-300 hover:border-dark-500'
                      )}
                    >
                      {HABIT_ICONS[cat]?.[0]} {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {getIconsForCategory().map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all',
                        formData.icon === icon
                          ? 'bg-primary-600/30 ring-2 ring-primary-500 scale-110'
                          : 'bg-dark-800 hover:bg-dark-700'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-dark-800 hover:bg-dark-700 text-dark-400 text-sm"
                  >
                    {showIconPicker ? '×' : '...'}
                  </button>
                </div>

                {/* Extended Icon Picker */}
                {showIconPicker && (
                  <div className="mt-3 p-3 bg-dark-800 rounded-lg max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {allIcons.map((icon, i) => (
                        <button
                          key={`${icon}-${i}`}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, icon });
                            setShowIconPicker(false);
                          }}
                          className={clsx(
                            'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all',
                            formData.icon === icon
                              ? 'bg-primary-600/30 ring-2 ring-primary-500'
                              : 'hover:bg-dark-700'
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                        'w-9 h-9 rounded-lg transition-all flex items-center justify-center',
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-offset-dark-850 ring-white scale-110'
                          : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    >
                      {formData.color === color.value && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Habit Type */}
              <div>
                <label className="label">How do you want to track this habit?</label>
                <div className="space-y-2">
                  {HABIT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          habitType: type.value as 'BOOLEAN' | 'NUMERIC' | 'DURATION',
                          unit: type.value === 'DURATION' ? 'minutes' : 'times',
                          targetValue: type.value === 'BOOLEAN' ? 1 : formData.targetValue,
                        });
                      }}
                      className={clsx(
                        'w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left',
                        formData.habitType === type.value
                          ? 'bg-primary-600/10 border-primary-500'
                          : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          formData.habitType === type.value
                            ? 'bg-primary-600/30 text-primary-400'
                            : 'bg-dark-700 text-dark-400'
                        )}
                      >
                        <type.icon size={20} />
                      </div>
                      <div>
                        <p
                          className={clsx(
                            'font-medium',
                            formData.habitType === type.value ? 'text-white' : 'text-dark-200'
                          )}
                        >
                          {type.label}
                        </p>
                        <p className="text-sm text-dark-400">{type.description}</p>
                        <p className="text-xs text-dark-500 mt-1">e.g., {type.example}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Value & Unit (for non-boolean types) */}
              {formData.habitType !== 'BOOLEAN' && (
                <div className="p-4 bg-dark-800 rounded-xl space-y-4">
                  <label className="label mb-0">Set your goal</label>

                  {/* Target Value */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className="w-12 h-12 rounded-xl bg-dark-700 text-white font-bold text-xl hover:bg-dark-600 transition-colors"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          targetValue: Math.max(1, formData.targetValue - 1),
                        })
                      }
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        min="1"
                        className="bg-transparent text-4xl font-bold text-white text-center w-full focus:outline-none"
                        value={formData.targetValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetValue: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="w-12 h-12 rounded-xl bg-dark-700 text-white font-bold text-xl hover:bg-dark-600 transition-colors"
                      onClick={() =>
                        setFormData({ ...formData, targetValue: formData.targetValue + 1 })
                      }
                    >
                      +
                    </button>
                  </div>

                  {/* Unit */}
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_UNITS[formData.habitType as keyof typeof COMMON_UNITS]?.map(
                        (unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => setFormData({ ...formData, unit })}
                            className={clsx(
                              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                              formData.unit === unit
                                ? 'bg-primary-600/30 text-primary-400 border border-primary-500'
                                : 'bg-dark-700 text-dark-300 border border-transparent hover:border-dark-500'
                            )}
                          >
                            {unit}
                          </button>
                        )
                      )}
                      <input
                        type="text"
                        placeholder="custom..."
                        className="px-3 py-1.5 rounded-lg text-sm bg-dark-700 text-white border border-transparent focus:border-primary-500 focus:outline-none w-24"
                        value={
                          !COMMON_UNITS[formData.habitType as keyof typeof COMMON_UNITS]?.includes(
                            formData.unit
                          )
                            ? formData.unit
                            : ''
                        }
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value || 'times' })
                        }
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="text-center pt-2 border-t border-dark-700">
                    <p className="text-dark-400 text-sm">Your goal:</p>
                    <p className="text-white font-semibold text-lg">
                      {formData.targetValue} {formData.unit} per{' '}
                      {formData.frequency === 'DAILY' ? 'day' : 'week'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 'schedule' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Frequency */}
              <div>
                <label className="label">How often?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, frequency: 'DAILY', daysOfWeek: [] })}
                    className={clsx(
                      'p-4 rounded-xl border transition-all text-left',
                      formData.frequency === 'DAILY'
                        ? 'bg-primary-600/10 border-primary-500'
                        : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Flame
                        size={24}
                        className={
                          formData.frequency === 'DAILY' ? 'text-primary-400' : 'text-dark-400'
                        }
                      />
                      <div>
                        <p
                          className={clsx(
                            'font-medium',
                            formData.frequency === 'DAILY' ? 'text-white' : 'text-dark-200'
                          )}
                        >
                          Daily
                        </p>
                        <p className="text-xs text-dark-500">Every single day</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, frequency: 'WEEKLY' })}
                    className={clsx(
                      'p-4 rounded-xl border transition-all text-left',
                      formData.frequency === 'WEEKLY'
                        ? 'bg-primary-600/10 border-primary-500'
                        : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar
                        size={24}
                        className={
                          formData.frequency === 'WEEKLY' ? 'text-primary-400' : 'text-dark-400'
                        }
                      />
                      <div>
                        <p
                          className={clsx(
                            'font-medium',
                            formData.frequency === 'WEEKLY' ? 'text-white' : 'text-dark-200'
                          )}
                        >
                          Weekly
                        </p>
                        <p className="text-xs text-dark-500">Specific days</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Days of Week (for weekly habits) */}
              {formData.frequency === 'WEEKLY' && (
                <div className="p-4 bg-dark-800 rounded-xl">
                  <label className="label mb-3">Which days?</label>
                  <div className="flex justify-between gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const days = formData.daysOfWeek.includes(day.value)
                            ? formData.daysOfWeek.filter((d: number) => d !== day.value)
                            : [...formData.daysOfWeek, day.value];
                          setFormData({ ...formData, daysOfWeek: days });
                        }}
                        className={clsx(
                          'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all',
                          formData.daysOfWeek.includes(day.value)
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-700 text-dark-400 hover:text-white'
                        )}
                        title={day.full}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {formData.daysOfWeek.length > 0 && (
                    <p className="text-sm text-dark-400 mt-3 text-center">
                      {formData.daysOfWeek
                        .sort((a: number, b: number) => a - b)
                        .map((d: number) => DAYS_OF_WEEK.find((day) => day.value === d)?.full)
                        .join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Preview Card */}
              <div className="p-4 bg-gradient-to-br from-dark-800 to-dark-900 rounded-xl border border-dark-600">
                <p className="text-xs text-dark-500 mb-3">Preview</p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    {formData.icon ? (
                      <span className="text-2xl">{formData.icon}</span>
                    ) : (
                      <Check size={28} style={{ color: formData.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">
                      {formData.name || 'Your Habit'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${formData.color}20`, color: formData.color }}
                      >
                        {formData.frequency.charAt(0) + formData.frequency.slice(1).toLowerCase()}
                      </span>
                      {formData.category && (
                        <span className="text-xs text-dark-500">{formData.category}</span>
                      )}
                      {formData.habitType !== 'BOOLEAN' && (
                        <span className="text-xs text-dark-500">
                          • {formData.targetValue} {formData.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation & Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-dark-700">
            {step !== 'basics' && (
              <button
                type="button"
                onClick={() => setStep(step === 'schedule' ? 'details' : 'basics')}
                className="btn btn-secondary"
              >
                Back
              </button>
            )}
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <div className="flex-1" />
            {step !== 'schedule' ? (
              <button
                type="button"
                onClick={() => setStep(step === 'basics' ? 'details' : 'schedule')}
                className="btn btn-primary"
              >
                Continue
              </button>
            ) : (
              <button type="submit" disabled={isLoading} className="btn btn-primary">
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
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;
