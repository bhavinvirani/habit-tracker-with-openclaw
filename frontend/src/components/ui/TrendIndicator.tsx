import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import clsx from 'clsx';

interface TrendIndicatorProps {
  /** Trend direction */
  trend: 'up' | 'down' | 'neutral';
  /** Percentage or value change */
  value?: number;
  /** Show as badge style */
  asBadge?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const iconSizes = {
  sm: 12,
  md: 16,
  lg: 20,
};

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  trend,
  value,
  asBadge = false,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    up: {
      icon: ArrowUpRight,
      color: 'text-accent-green',
      bg: 'bg-accent-green/20',
      borderColor: 'border-accent-green/20',
    },
    down: {
      icon: ArrowDownRight,
      color: 'text-accent-red',
      bg: 'bg-accent-red/20',
      borderColor: 'border-accent-red/20',
    },
    neutral: {
      icon: Minus,
      color: 'text-dark-400',
      bg: 'bg-dark-700',
      borderColor: 'border-dark-600',
    },
  };

  const { icon: Icon, color, bg, borderColor } = config[trend];

  if (asBadge) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded-full font-medium border',
          bg,
          borderColor,
          color,
          size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1',
          sizeClasses[size]
        )}
      >
        {showIcon && <Icon size={iconSizes[size]} />}
        {value !== undefined && (
          <span>
            {trend === 'up' ? '+' : trend === 'down' ? '' : ''}
            {value}%
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={clsx('inline-flex items-center gap-1', color, sizeClasses[size])}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {value !== undefined && (
        <span className="font-medium">
          {trend === 'up' ? '+' : ''}
          {value}%
        </span>
      )}
    </span>
  );
};

export default TrendIndicator;
