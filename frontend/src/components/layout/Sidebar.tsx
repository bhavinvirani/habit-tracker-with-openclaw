import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  User,
  Calendar,
  BookOpen,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  HelpCircle,
  X,
  MessageCircle,
} from 'lucide-react';
import { analyticsApi, trackingApi } from '../../services/habits';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['overview'],
    queryFn: analyticsApi.getOverview,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch today's habits
  const { data: todayData } = useQuery({
    queryKey: ['today'],
    queryFn: trackingApi.getToday,
    staleTime: 60 * 1000,
  });

  const navItems = [
    {
      to: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      badge: null,
    },
    {
      to: '/habits',
      icon: CheckSquare,
      label: 'Habits',
      badge: stats?.activeHabits ? String(stats.activeHabits) : null,
    },
    {
      to: '/calendar',
      icon: Calendar,
      label: 'Calendar',
      badge: null,
    },
    {
      to: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      badge: null,
    },
    {
      to: '/books',
      icon: BookOpen,
      label: 'Books',
      badge: null,
    },
    {
      to: '/challenges',
      icon: Trophy,
      label: 'Challenges',
      badge: null,
    },
    {
      to: '/profile',
      icon: User,
      label: 'Profile',
      badge: null,
    },
  ];

  const todayProgress = todayData?.summary
    ? Math.round((todayData.summary.completed / Math.max(todayData.summary.total, 1)) * 100)
    : 0;

  const sidebarContent = (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-dark-700">
        <span className="font-semibold text-white">Menu</span>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Today's Progress Card */}
      <div className="p-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary-900/50 to-dark-800 border border-primary-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-300">Today's Progress</span>
            <span className="text-sm font-bold text-primary-400">{todayProgress}%</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">
              {todayData?.summary?.completed || 0} of {todayData?.summary?.total || 0} habits
            </span>
            {todayData?.summary?.remaining ? (
              <span className="text-accent-orange">{todayData.summary.remaining} left</span>
            ) : todayData?.summary?.total ? (
              <span className="text-accent-green">All done! 🎉</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative',
                    isActive
                      ? 'bg-primary-500/15 text-primary-400 font-medium'
                      : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                    )}
                    <item.icon
                      size={20}
                      className={clsx(
                        'transition-transform group-hover:scale-110',
                        isActive && 'text-primary-400'
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-dark-700 text-dark-300">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Stats Footer */}
      <div className="p-4 border-t border-dark-700/50">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-dark-800/50">
            <div className="flex items-center justify-center gap-1 text-accent-orange mb-0.5">
              <Flame size={14} />
              <span className="font-bold text-sm">{stats?.currentBestStreak || 0}</span>
            </div>
            <p className="text-[10px] text-dark-500">Streak</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-dark-800/50">
            <div className="flex items-center justify-center gap-1 text-accent-green mb-0.5">
              <Target size={14} />
              <span className="font-bold text-sm">{stats?.monthlyCompletionRate || 0}%</span>
            </div>
            <p className="text-[10px] text-dark-500">This Month</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-dark-800/50">
            <div className="flex items-center justify-center gap-1 text-primary-400 mb-0.5">
              <TrendingUp size={14} />
              <span className="font-bold text-sm">{stats?.totalCompletions || 0}</span>
            </div>
            <p className="text-[10px] text-dark-500">Total</p>
          </div>
        </div>

        {/* Help & Integration Links */}
        <NavLink
          to="/docs/integration"
          className={({ isActive }) =>
            clsx(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors mb-2',
              isActive
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-dark-500 hover:bg-dark-800 hover:text-dark-300'
            )
          }
        >
          <MessageCircle size={18} />
          <span className="text-sm">OpenClaw Integration</span>
        </NavLink>
        <NavLink
          to="/help"
          className={({ isActive }) =>
            clsx(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors',
              isActive
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-dark-500 hover:bg-dark-800 hover:text-dark-300'
            )
          }
        >
          <HelpCircle size={18} />
          <span className="text-sm">Help & Support</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-dark-700 z-50 flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-dark-900/50 backdrop-blur-sm border-r border-dark-700/50 flex-col">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
