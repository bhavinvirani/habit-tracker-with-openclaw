import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export interface ViewOption<T = string> {
  id: T;
  icon: LucideIcon;
  label: string;
}

interface ViewToggleProps<T = string> {
  /** Currently selected view */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Available view options */
  options: ViewOption<T>[];
  /** Whether to show labels */
  showLabels?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

function ViewToggle<T extends string>({
  value,
  onChange,
  options,
  showLabels = true,
  size = 'md',
}: ViewToggleProps<T>) {
  return (
    <div className="flex items-center gap-1 p-1 bg-dark-800 rounded-lg">
      {options.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={clsx(
            'flex items-center gap-2 rounded-md font-medium transition-all',
            size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            value === id
              ? 'bg-primary-600 text-white'
              : 'text-dark-400 hover:text-white hover:bg-dark-700'
          )}
        >
          <Icon size={size === 'sm' ? 14 : 16} />
          {showLabels && <span className="hidden sm:inline">{label}</span>}
        </button>
      ))}
    </div>
  );
}

export default ViewToggle;
