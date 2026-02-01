import React from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Whether to show clear button */
  showClear?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
}

const sizeClasses = {
  sm: 'pl-8 pr-3 py-1.5 text-sm',
  md: 'pl-10 pr-4 py-2 text-sm',
  lg: 'pl-11 pr-4 py-2.5',
};

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18,
};

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  size = 'md',
  className,
  showClear = true,
  autoFocus = false,
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={clsx('relative', className)}>
      <Search
        size={iconSizes[size]}
        className={clsx(
          'absolute top-1/2 -translate-y-1/2 text-dark-500',
          size === 'sm' ? 'left-2.5' : 'left-3'
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={clsx(
          'w-full bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500',
          'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20',
          'transition-all',
          sizeClasses[size],
          showClear && value && 'pr-9'
        )}
      />
      {showClear && value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
        >
          <X size={iconSizes[size]} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
