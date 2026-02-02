import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Clock, Plus, Trash2, Loader2, BellOff, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  remindersApi,
  HabitReminder,
  NotificationSettings as NotifSettings,
} from '../services/reminders';
import { habitsApi } from '../services/habits';
import clsx from 'clsx';

const NotificationSettingsComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const [newReminderHabitId, setNewReminderHabitId] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('20:00');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch reminders
  const { data: reminders, isLoading: loadingReminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: remindersApi.getReminders,
  });

  // Fetch notification settings
  const { data: settings } = useQuery<NotifSettings>({
    queryKey: ['notification-settings'],
    queryFn: remindersApi.getSettings,
  });

  // Fetch habits for the add reminder dropdown
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: habitsApi.getAll,
  });

  // Create reminder mutation
  const createMutation = useMutation({
    mutationFn: ({ habitId, time }: { habitId: string; time: string }) =>
      remindersApi.createReminder(habitId, time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowAddForm(false);
      setNewReminderHabitId('');
      toast.success('Reminder set');
    },
    onError: () => {
      toast.error('Failed to set reminder');
    },
  });

  // Delete reminder mutation
  const deleteMutation = useMutation({
    mutationFn: remindersApi.deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder removed');
    },
    onError: () => {
      toast.error('Failed to remove reminder');
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: remindersApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  // Filter out habits that already have reminders
  const reminderHabitIds = new Set((reminders ?? []).map((r: HabitReminder) => r.habitId));
  const availableHabits = (habits ?? []).filter(
    (h: { id: string; isArchived?: boolean }) => !reminderHabitIds.has(h.id) && !h.isArchived
  );

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent-orange/20 flex items-center justify-center">
          <Bell size={20} className="text-accent-orange" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Notifications & Reminders</h3>
          <p className="text-sm text-dark-400">Get reminded about incomplete habits</p>
        </div>
      </div>

      {/* Daily Summary Toggle */}
      <div className="p-4 rounded-xl bg-dark-900 border border-dark-700 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-dark-400" />
            <div>
              <p className="font-medium text-white">Daily Summary</p>
              <p className="text-xs text-dark-500">
                Receive a summary of incomplete habits at a set time
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              updateSettingsMutation.mutate({
                dailySummaryEnabled: !settings?.dailySummaryEnabled,
              })
            }
            className={clsx(
              'relative w-12 h-6 rounded-full transition-colors',
              settings?.dailySummaryEnabled ? 'bg-primary-500' : 'bg-dark-600'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                settings?.dailySummaryEnabled ? 'left-6' : 'left-0.5'
              )}
            />
          </button>
        </div>

        {settings?.dailySummaryEnabled && (
          <div className="mt-3 pt-3 border-t border-dark-700">
            <label className="text-xs text-dark-400 block mb-1">Summary time</label>
            <input
              type="time"
              value={settings?.dailySummaryTime ?? '21:00'}
              onChange={(e) =>
                updateSettingsMutation.mutate({
                  dailySummaryTime: e.target.value,
                })
              }
              className="input w-32"
            />
          </div>
        )}
      </div>

      {/* Habit Reminders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white">Per-Habit Reminders</h4>
          {availableHabits.length > 0 && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              Add
            </button>
          )}
        </div>

        {/* Add Reminder Form */}
        {showAddForm && (
          <div className="p-4 rounded-xl bg-dark-900 border border-primary-500/30">
            <div className="flex gap-3">
              <select
                value={newReminderHabitId}
                onChange={(e) => setNewReminderHabitId(e.target.value)}
                className="input flex-1"
              >
                <option value="">Select a habit...</option>
                {availableHabits.map((h: { id: string; name: string }) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="input w-32"
              />
              <button
                onClick={() => {
                  if (newReminderHabitId) {
                    createMutation.mutate({
                      habitId: newReminderHabitId,
                      time: newReminderTime,
                    });
                  }
                }}
                disabled={!newReminderHabitId || createMutation.isPending}
                className="btn btn-primary btn-sm"
              >
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Reminder List */}
        {loadingReminders ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
          </div>
        ) : reminders && reminders.length > 0 ? (
          <div className="space-y-2">
            {reminders.map((reminder: HabitReminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 border border-dark-700"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${reminder.habit.color}20` }}
                >
                  <Target size={16} style={{ color: reminder.habit.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{reminder.habit.name}</p>
                  <p className="text-xs text-dark-400">Remind at {reminder.time}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(reminder.habitId)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 rounded-lg text-dark-500 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <BellOff size={32} className="mx-auto text-dark-600 mb-2" />
            <p className="text-dark-400 text-sm">No habit reminders set</p>
            <p className="text-dark-500 text-xs mt-1">
              Add reminders to get notified when habits are incomplete
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsComponent;
