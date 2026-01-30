import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  User,
  Calendar,
  BookOpen,
  Trophy,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/habits', icon: CheckSquare, label: 'Habits' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/books', icon: BookOpen, label: 'Books' },
    { to: '/challenges', icon: Trophy, label: 'Challenges' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-dark-900 border-r border-dark-700">
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 font-medium border-l-2 border-primary-500'
                      : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
