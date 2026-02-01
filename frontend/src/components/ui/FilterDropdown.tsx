import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

export interface FilterOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface FilterDropdownProps<T = string> {
  /** Currently selected value */
  value: T | null;
  /** Change handler */
  onChange: (value: T | null) => void;
  /** Available options */
  options: FilterOption<T>[];
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Whether to show "All" option */
  showAllOption?: boolean;
  /** Label for "All" option */
  allLabel?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
  /** Icon to show before label */
  icon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
};

function FilterDropdown<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  showAllOption = true,
  allLabel = 'All',
  size = 'md',
  className,
  icon,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel =
    selectedOption?.label || (value === null && showAllOption ? allLabel : placeholder);

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center rounded-lg transition-colors',
          'bg-dark-800 border border-dark-600 text-white',
          'hover:border-dark-500',
          isOpen && 'border-primary-500',
          sizeClasses[size]
        )}
      >
        {icon}
        <span className={clsx(!value && 'text-dark-400')}>{displayLabel}</span>
        <ChevronDown
          size={16}
          className={clsx('text-dark-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 min-w-full w-max bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden">
          {showAllOption && (
            <button
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2 text-sm transition-colors',
                value === null
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-dark-200 hover:bg-dark-700'
              )}
            >
              <span>{allLabel}</span>
              {value === null && <Check size={16} />}
            </button>
          )}
          {options.map((option) => (
            <button
              key={String(option.value)}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={clsx(
                'w-full flex items-center justify-between gap-3 px-4 py-2 text-sm transition-colors',
                value === option.value
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-dark-200 hover:bg-dark-700'
              )}
            >
              <span className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </span>
              {value === option.value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
