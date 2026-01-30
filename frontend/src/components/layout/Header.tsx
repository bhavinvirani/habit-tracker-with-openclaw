import React from 'react';
import { LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Habit Tracker</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-dark-200">{user?.name || 'User'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-all"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
