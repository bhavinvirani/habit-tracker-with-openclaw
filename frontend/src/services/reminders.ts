import api from './api';

export interface HabitReminder {
  id: string;
  habitId: string;
  time: string;
  isActive: boolean;
  habit: {
    id: string;
    name: string;
    icon: string | null;
    color: string;
  };
}

export interface NotificationSettings {
  dailySummaryEnabled: boolean;
  dailySummaryTime: string | null;
  reminderEnabled: boolean;
}

export const remindersApi = {
  getReminders: async (): Promise<HabitReminder[]> => {
    const response = await api.get('/reminders');
    return response.data.data.reminders;
  },

  createReminder: async (habitId: string, time: string): Promise<HabitReminder> => {
    const response = await api.post('/reminders', { habitId, time });
    return response.data.data.reminder;
  },

  deleteReminder: async (habitId: string): Promise<void> => {
    await api.delete(`/reminders/${habitId}`);
  },

  getSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get('/reminders/settings');
    return response.data.data.settings;
  },

  updateSettings: async (
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> => {
    const response = await api.put('/reminders/settings', settings);
    return response.data.data.settings;
  },
};
