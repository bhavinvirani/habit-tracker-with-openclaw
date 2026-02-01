import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom class name */
  className?: string;
  /** Whether to center in a full height container */
  fullHeight?: boolean;
  /** Text to display below spinner */
  text?: string;
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  fullHeight = true,
  text,
}) => {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={clsx(sizeMap[size], 'animate-spin text-primary-500', className)} />
      {text && <p className="text-sm text-dark-400">{text}</p>}
    </div>
  );

  if (fullHeight) {
    return <div className="flex items-center justify-center h-96">{spinner}</div>;
  }

  return spinner;
};

export default LoadingSpinner;
