// Frequency configuration
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface FrequencyConfig {
  value: Frequency;
  label: string;
  description: string;
  daysInPeriod: number;
}

export const FREQUENCIES: FrequencyConfig[] = [
  { value: 'DAILY', label: 'Daily', description: 'Every day', daysInPeriod: 1 },
  { value: 'WEEKLY', label: 'Weekly', description: 'Once a week', daysInPeriod: 7 },
  { value: 'MONTHLY', label: 'Monthly', description: 'Once a month', daysInPeriod: 30 },
];

export const FREQUENCY_OPTIONS = FREQUENCIES.map((f) => ({
  value: f.value,
  label: f.label,
}));

export const getFrequencyLabel = (frequency: Frequency): string => {
  return FREQUENCIES.find((f) => f.value === frequency)?.label || frequency;
};

export const formatFrequency = (frequency: string): string => {
  return frequency.charAt(0) + frequency.slice(1).toLowerCase();
};
