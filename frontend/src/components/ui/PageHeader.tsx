import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Optional action button */
  action?: React.ReactNode;
  /** Additional content to render on the right side */
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-400" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-dark-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action}
      </div>
    </div>
  );
};

export default PageHeader;
