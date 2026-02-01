import React from 'react';
import clsx from 'clsx';

interface CircularProgressProps {
  /** Percentage value (0-100) */
  percent: number;
  /** Size of the circle in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Show percentage text in center */
  showText?: boolean;
  /** Optional label below percentage */
  label?: string;
  /** Gradient colors - [start, end] */
  gradientColors?: [string, string];
  /** Background track color */
  trackColor?: string;
  /** Custom content for center */
  children?: React.ReactNode;
  /** Unique gradient ID (needed when multiple instances on page) */
  gradientId?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percent,
  size = 80,
  strokeWidth = 6,
  showText = true,
  label,
  gradientColors = ['#6366f1', '#8b5cf6'],
  trackColor = 'currentColor',
  children,
  gradientId = 'progressGradient',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          className="text-dark-700"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ? (
          children
        ) : showText ? (
          <>
            <span className={clsx('font-bold text-white', size > 100 ? 'text-4xl' : 'text-lg')}>
              {Math.round(percent)}%
            </span>
            {label && <span className="text-sm text-dark-400">{label}</span>}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default CircularProgress;
