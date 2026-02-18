import React from 'react';
import { LayoutDashboard, Flag, Users, FileText, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export type AdminTab = 'overview' | 'flags' | 'users' | 'reports';

interface Tab {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'flags', label: 'Feature Flags', icon: Flag },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'AI Reports', icon: FileText },
];

interface AdminTabNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const AdminTabNav: React.FC<AdminTabNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-1 p-1 bg-dark-800/50 border border-dark-700 rounded-xl overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              isActive
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
            )}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default AdminTabNav;
