import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export interface StatCardProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Value to display */
  value: string | number;
  /** Label below the value */
  label: string;
  /** Color theme - maps to Tailwind colors */
  color: 'orange' | 'green' | 'purple' | 'blue' | 'yellow' | 'red' | 'primary';
  /** Card variant */
  variant?: 'default' | 'compact' | 'minimal';
  /** Optional suffix for the value (e.g., %, days) */
  suffix?: string;
  /** Optional click handler */
  onClick?: () => void;
}

const colorMap = {
  orange: {
    bg: 'bg-accent-orange/10',
    border: 'border-accent-orange/20',
    text: 'text-accent-orange',
    iconBg: 'bg-accent-orange/20',
  },
  green: {
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/20',
    text: 'text-accent-green',
    iconBg: 'bg-accent-green/20',
  },
  purple: {
    bg: 'bg-accent-purple/10',
    border: 'border-accent-purple/20',
    text: 'text-accent-purple',
    iconBg: 'bg-accent-purple/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
  },
  yellow: {
    bg: 'bg-accent-yellow/10',
    border: 'border-accent-yellow/20',
    text: 'text-accent-yellow',
    iconBg: 'bg-accent-yellow/20',
  },
  red: {
    bg: 'bg-accent-red/10',
    border: 'border-accent-red/20',
    text: 'text-accent-red',
    iconBg: 'bg-accent-red/20',
  },
  primary: {
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    text: 'text-primary-400',
    iconBg: 'bg-primary-500/20',
  },
};

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  color,
  variant = 'default',
  suffix,
  onClick,
}) => {
  const colors = colorMap[color];

  if (variant === 'minimal') {
    return (
      <div
        className={clsx(
          'flex items-center gap-3 p-3 rounded-lg bg-dark-800/50',
          onClick && 'cursor-pointer hover:bg-dark-700 transition-colors'
        )}
        onClick={onClick}
      >
        <div
          className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', colors.iconBg)}
        >
          <Icon className={clsx('w-5 h-5', colors.text)} />
        </div>
        <div>
          <span className="text-lg font-bold text-white">
            {value}
            {suffix}
          </span>
          <p className="text-xs text-dark-400">{label}</p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={clsx(
          'flex flex-col items-center p-3 rounded-xl',
          colors.bg,
          `border ${colors.border}`,
          onClick && 'cursor-pointer hover:scale-105 transition-transform'
        )}
        onClick={onClick}
      >
        <Icon className={clsx('w-5 h-5 mb-1', colors.text)} />
        <span className={clsx('text-xl font-bold', colors.text)}>
          {value}
          {suffix}
        </span>
        <span className="text-xs text-dark-400 text-center">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex flex-col items-center p-4 rounded-xl',
        colors.bg,
        `border ${colors.border}`,
        onClick && 'cursor-pointer hover:scale-105 transition-transform'
      )}
      onClick={onClick}
    >
      <Icon className={clsx('w-6 h-6 mb-2', colors.text)} />
      <span className={clsx('text-2xl font-bold', colors.text)}>
        {value}
        {suffix}
      </span>
      <span className="text-xs text-dark-400 text-center mt-1">{label}</span>
    </div>
  );
};

export default StatCard;
