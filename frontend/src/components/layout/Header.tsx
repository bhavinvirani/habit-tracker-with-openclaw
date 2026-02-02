import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Flame,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Trophy,
  Target,
  Menu,
  X,
  Keyboard,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { analyticsApi } from '../../services/habits';
import clsx from 'clsx';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  onShowShortcuts?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen,
  onShowShortcuts,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch stats for streak display
  const { data: stats } = useQuery({
    queryKey: ['overview'],
    queryFn: analyticsApi.getOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate level from total completions
  const level = Math.floor((stats?.totalCompletions || 0) / 50) + 1;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50 z-50">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white leading-tight">Habit Tracker</h1>
              <p className="text-[10px] text-dark-500 -mt-0.5">Build better habits</p>
            </div>
          </Link>
        </div>

        {/* Right: Stats, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Badge */}
          {stats && stats.currentBestStreak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-orange/10 border border-accent-orange/20">
              <Flame size={16} className="text-accent-orange" />
              <span className="text-sm font-semibold text-accent-orange">
                {stats.currentBestStreak}
              </span>
            </div>
          )}

          {/* Today's Progress Mini */}
          {stats && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50 border border-dark-700/50">
              <Target size={16} className="text-primary-400" />
              <span className="text-sm text-dark-300">
                <span className="font-semibold text-white">{stats.completedToday}</span>
                <span className="text-dark-500">/{stats.totalToday}</span>
              </span>
            </div>
          )}

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onShowShortcuts}
            className="hidden sm:flex items-center gap-1.5 p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors group"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard size={20} />
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] font-mono bg-dark-900 border border-dark-600 rounded text-dark-500 group-hover:text-dark-300 group-hover:border-dark-500">
              ?
            </kbd>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
            <Bell size={20} />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={clsx(
                'flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all',
                isProfileOpen ? 'bg-dark-800' : 'hover:bg-dark-800/50'
              )}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                {/* Level badge */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent-yellow flex items-center justify-center shadow-sm">
                  <span className="text-[8px] font-bold text-dark-900">{level}</span>
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-dark-500">Level {level}</p>
              </div>
              <ChevronDown
                size={16}
                className={clsx(
                  'hidden sm:block text-dark-500 transition-transform',
                  isProfileOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="p-4 border-b border-dark-700">
                  <p className="font-medium text-white">{user?.name}</p>
                  <p className="text-sm text-dark-400 truncate">{user?.email}</p>
                </div>

                {/* Quick Stats */}
                <div className="p-3 border-b border-dark-700 grid grid-cols-2 gap-2">
                  <div className="text-center p-2 rounded-lg bg-dark-900/50">
                    <div className="flex items-center justify-center gap-1 text-accent-orange">
                      <Flame size={14} />
                      <span className="font-bold">{stats?.currentBestStreak || 0}</span>
                    </div>
                    <p className="text-[10px] text-dark-500">Streak</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-dark-900/50">
                    <div className="flex items-center justify-center gap-1 text-accent-yellow">
                      <Trophy size={14} />
                      <span className="font-bold">{stats?.longestEverStreak || 0}</span>
                    </div>
                    <p className="text-[10px] text-dark-500">Best</p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/profile?tab=settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
