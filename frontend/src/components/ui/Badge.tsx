import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Badge variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'custom';
  /** Custom color (hex or CSS color) - only used with variant="custom" */
  color?: string;
  /** Size of the badge */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

const variantClasses = {
  default: 'bg-dark-700 text-dark-300',
  primary: 'bg-primary-500/20 text-primary-400',
  success: 'bg-accent-green/20 text-accent-green',
  warning: 'bg-accent-orange/20 text-accent-orange',
  danger: 'bg-accent-red/20 text-accent-red',
  custom: '', // Uses inline styles
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  color,
  size = 'sm',
  className,
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';

  if (variant === 'custom' && color) {
    return (
      <span
        className={clsx(baseClasses, sizeClasses[size], className)}
        style={{ backgroundColor: `${color}20`, color }}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
};

export default Badge;

// Preset badges for common use cases
export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const categoryColors: Record<string, string> = {
    Health: '#3b82f6',
    Fitness: '#10b981',
    Learning: '#f59e0b',
    Productivity: '#ef4444',
    Mindfulness: '#8b5cf6',
    Social: '#ec4899',
    Finance: '#14b8a6',
    Other: '#64748b',
  };

  const color = categoryColors[category] || categoryColors.Other;

  return (
    <Badge variant="custom" color={color}>
      {category}
    </Badge>
  );
};

export const FrequencyBadge: React.FC<{ frequency: string }> = ({ frequency }) => {
  return <Badge variant="primary">{frequency.charAt(0) + frequency.slice(1).toLowerCase()}</Badge>;
};
