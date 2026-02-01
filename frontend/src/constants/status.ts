import {
  LucideIcon,
  Flame,
  Trophy,
  XCircle,
  Pause,
  Bookmark,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

// Challenge status configuration
export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface StatusConfig<T extends string> {
  value: T;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export const CHALLENGE_STATUS_CONFIG: Record<ChallengeStatus, StatusConfig<ChallengeStatus>> = {
  ACTIVE: {
    value: 'ACTIVE',
    label: 'Active',
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/20',
    borderColor: 'border-primary-500/20',
    icon: Flame,
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: 'Completed',
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/20',
    borderColor: 'border-accent-green/20',
    icon: Trophy,
  },
  FAILED: {
    value: 'FAILED',
    label: 'Failed',
    color: 'text-accent-red',
    bgColor: 'bg-accent-red/20',
    borderColor: 'border-accent-red/20',
    icon: XCircle,
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: 'Cancelled',
    color: 'text-dark-400',
    bgColor: 'bg-dark-700',
    borderColor: 'border-dark-600',
    icon: Pause,
  },
};

// Book status configuration
export type BookStatus = 'WANT_TO_READ' | 'READING' | 'FINISHED' | 'ABANDONED';

export const BOOK_STATUS_CONFIG: Record<BookStatus, StatusConfig<BookStatus>> = {
  WANT_TO_READ: {
    value: 'WANT_TO_READ',
    label: 'Want to Read',
    color: 'text-dark-300',
    bgColor: 'bg-dark-700',
    borderColor: 'border-dark-600',
    icon: Bookmark,
  },
  READING: {
    value: 'READING',
    label: 'Reading',
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/20',
    borderColor: 'border-primary-500/20',
    icon: BookOpen,
  },
  FINISHED: {
    value: 'FINISHED',
    label: 'Finished',
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/20',
    borderColor: 'border-accent-green/20',
    icon: CheckCircle,
  },
  ABANDONED: {
    value: 'ABANDONED',
    label: 'Abandoned',
    color: 'text-dark-500',
    bgColor: 'bg-dark-700',
    borderColor: 'border-dark-600',
    icon: XCircle,
  },
};

// Challenge duration presets
export interface DurationPreset {
  label: string;
  value: number;
  description: string;
}

export const DURATION_PRESETS: DurationPreset[] = [
  { label: '7 days', value: 7, description: 'Perfect for testing new habits' },
  { label: '14 days', value: 14, description: 'Build initial momentum' },
  { label: '21 days', value: 21, description: 'Form new neural pathways' },
  { label: '30 days', value: 30, description: 'Establish lasting habits' },
  { label: '60 days', value: 60, description: 'Deep habit formation' },
  { label: '90 days', value: 90, description: 'Transform your lifestyle' },
];

// Helper functions
export const getChallengeStatusConfig = (status: ChallengeStatus) =>
  CHALLENGE_STATUS_CONFIG[status];
export const getBookStatusConfig = (status: BookStatus) => BOOK_STATUS_CONFIG[status];

export const getChallengeStatusOptions = () => {
  return Object.values(CHALLENGE_STATUS_CONFIG).map((config) => ({
    value: config.value,
    label: config.label,
  }));
};

export const getBookStatusOptions = () => {
  return Object.values(BOOK_STATUS_CONFIG).map((config) => ({
    value: config.value,
    label: config.label,
  }));
};
