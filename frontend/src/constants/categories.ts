// Centralized category configuration
export interface CategoryConfig {
  name: string;
  color: string;
  description?: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Health: '#3b82f6',
  Fitness: '#10b981',
  Learning: '#f59e0b',
  Productivity: '#ef4444',
  Mindfulness: '#8b5cf6',
  Social: '#ec4899',
  Finance: '#14b8a6',
  Creativity: '#f97316',
  Career: '#0ea5e9',
  Other: '#64748b',
};

export const CATEGORIES: CategoryConfig[] = [
  { name: 'Health', color: '#3b82f6', description: 'Physical and mental health habits' },
  { name: 'Fitness', color: '#10b981', description: 'Exercise and physical activity' },
  { name: 'Learning', color: '#f59e0b', description: 'Education and skill development' },
  { name: 'Productivity', color: '#ef4444', description: 'Work and task management' },
  { name: 'Mindfulness', color: '#8b5cf6', description: 'Meditation and mental wellness' },
  { name: 'Social', color: '#ec4899', description: 'Relationships and networking' },
  { name: 'Finance', color: '#14b8a6', description: 'Money and financial habits' },
  { name: 'Creativity', color: '#f97316', description: 'Art, music, and creative pursuits' },
  { name: 'Career', color: '#0ea5e9', description: 'Professional development' },
  { name: 'Other', color: '#64748b', description: 'Miscellaneous habits' },
];

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
};

export const getCategoryOptions = () => {
  return CATEGORIES.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));
};
