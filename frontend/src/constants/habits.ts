import {
  Droplets,
  Dumbbell,
  BookOpen,
  Brain,
  Moon,
  PenLine,
  Coffee,
  Apple,
  Footprints,
  Music,
  Code,
  Wallet,
  Heart,
  MessageCircle,
  LucideIcon,
} from 'lucide-react';

// Suggested habits for empty states and quick-add
export interface SuggestedHabit {
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  category: string;
  frequency?: 'DAILY' | 'WEEKLY';
  targetValue?: number;
  targetUnit?: string;
}

export const SUGGESTED_HABITS: SuggestedHabit[] = [
  {
    name: 'Drink Water',
    icon: Droplets,
    color: '#3b82f6',
    description: '8 glasses daily',
    category: 'Health',
    targetValue: 8,
    targetUnit: 'glasses',
  },
  {
    name: 'Exercise',
    icon: Dumbbell,
    color: '#ef4444',
    description: '30 min workout',
    category: 'Fitness',
    targetValue: 30,
    targetUnit: 'minutes',
  },
  {
    name: 'Read',
    icon: BookOpen,
    color: '#8b5cf6',
    description: '20 pages daily',
    category: 'Learning',
    targetValue: 20,
    targetUnit: 'pages',
  },
  {
    name: 'Meditate',
    icon: Brain,
    color: '#14b8a6',
    description: '10 min mindfulness',
    category: 'Mindfulness',
    targetValue: 10,
    targetUnit: 'minutes',
  },
  {
    name: 'Sleep 8 Hours',
    icon: Moon,
    color: '#6366f1',
    description: 'Better rest',
    category: 'Health',
    targetValue: 8,
    targetUnit: 'hours',
  },
  {
    name: 'Journal',
    icon: PenLine,
    color: '#f59e0b',
    description: 'Daily reflection',
    category: 'Mindfulness',
  },
  {
    name: 'Morning Coffee Ritual',
    icon: Coffee,
    color: '#78716c',
    description: 'Start day mindfully',
    category: 'Mindfulness',
  },
  {
    name: 'Eat Healthy',
    icon: Apple,
    color: '#22c55e',
    description: 'Balanced meals',
    category: 'Health',
  },
  {
    name: 'Walk 10K Steps',
    icon: Footprints,
    color: '#10b981',
    description: 'Daily movement',
    category: 'Fitness',
    targetValue: 10000,
    targetUnit: 'steps',
  },
  {
    name: 'Practice Music',
    icon: Music,
    color: '#ec4899',
    description: '30 min practice',
    category: 'Creativity',
    targetValue: 30,
    targetUnit: 'minutes',
  },
  {
    name: 'Code',
    icon: Code,
    color: '#0ea5e9',
    description: 'Build something',
    category: 'Career',
  },
  {
    name: 'Save Money',
    icon: Wallet,
    color: '#14b8a6',
    description: 'Daily savings',
    category: 'Finance',
  },
  {
    name: 'Self-Care',
    icon: Heart,
    color: '#f43f5e',
    description: 'Personal wellness',
    category: 'Health',
  },
  {
    name: 'Connect with Friend',
    icon: MessageCircle,
    color: '#ec4899',
    description: 'Stay in touch',
    category: 'Social',
    frequency: 'WEEKLY',
  },
];

// Get random suggested habits
export const getRandomSuggestedHabits = (count: number = 6): SuggestedHabit[] => {
  const shuffled = [...SUGGESTED_HABITS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Get suggested habits by category
export const getSuggestedHabitsByCategory = (category: string): SuggestedHabit[] => {
  return SUGGESTED_HABITS.filter((h) => h.category === category);
};
