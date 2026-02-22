import React from 'react';
import clsx from 'clsx';

interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether the card is hoverable */
  hoverable?: boolean;
  /** Card padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  padding = 'md',
  header,
  footer,
}) => {
  return (
    <div
      className={clsx(
        'bg-dark-800/50 border border-dark-700 rounded-xl',
        hoverable && 'hover:border-dark-600 hover:bg-dark-800 transition-all cursor-pointer',
        className
      )}
    >
      {header && (
        <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-dark-700 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

// Section header for use inside cards
interface CardSectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardSectionHeader: React.FC<CardSectionHeaderProps> = ({
  title,
  action,
  className,
}) => {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider">{title}</h3>
      {action}
    </div>
  );
};
