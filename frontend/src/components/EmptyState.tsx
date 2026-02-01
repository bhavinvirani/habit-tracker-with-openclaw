import React from 'react';
import { Target, Plus, Sparkles, ArrowRight, Zap, BookOpen, Coffee } from 'lucide-react';
import { SUGGESTED_HABITS } from '../constants/habits';

interface EmptyStateProps {
  type: 'habits' | 'books' | 'challenges' | 'analytics' | 'dashboard';
  onAction?: () => void;
  actionLabel?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, actionLabel }) => {
  if (type === 'habits') {
    return (
      <div className="text-center py-12">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <Sparkles size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Start Your Journey</h2>
          <p className="text-dark-400 max-w-md mx-auto">
            Build better habits, one day at a time. Create your first habit to get started!
          </p>
        </div>

        {/* Suggested Habits */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-4">
            Popular habits to try
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {SUGGESTED_HABITS.map((habit) => {
              const Icon = habit.icon;
              return (
                <button
                  key={habit.name}
                  onClick={onAction}
                  className="group p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:border-primary-500/50 hover:bg-dark-800 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <Icon size={20} style={{ color: habit.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{habit.name}</p>
                      <p className="text-xs text-dark-500">{habit.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-dark-500">{habit.category}</span>
                    <ArrowRight
                      size={14}
                      className="text-dark-600 group-hover:text-primary-400 transition-colors"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Button */}
        <button onClick={onAction} className="btn btn-primary btn-lg">
          <Plus size={20} />
          {actionLabel || 'Create Your First Habit'}
        </button>

        {/* Tips */}
        <div className="mt-12 p-6 rounded-xl bg-dark-800/30 border border-dark-700/50 max-w-lg mx-auto">
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Zap size={18} className="text-accent-yellow" />
            Pro Tips for Success
          </h4>
          <ul className="text-sm text-dark-400 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary-400">•</span>
              Start with just 2-3 habits to avoid overwhelm
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400">•</span>
              Stack new habits with existing routines
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400">•</span>
              Focus on consistency, not perfection
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (type === 'books') {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-purple to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-purple/30">
          <BookOpen size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Track Your Reading</h2>
        <p className="text-dark-400 max-w-md mx-auto mb-6">
          Add books to your reading list and track your progress page by page.
        </p>
        <button onClick={onAction} className="btn btn-primary btn-lg">
          <Plus size={20} />
          {actionLabel || 'Add Your First Book'}
        </button>
      </div>
    );
  }

  if (type === 'challenges') {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-yellow to-accent-orange flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-yellow/30">
          <Target size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Challenge Yourself</h2>
        <p className="text-dark-400 max-w-md mx-auto mb-6">
          Create challenges to push your limits and build lasting habits.
        </p>
        <button onClick={onAction} className="btn btn-primary btn-lg">
          <Plus size={20} />
          {actionLabel || 'Create a Challenge'}
        </button>
      </div>
    );
  }

  if (type === 'analytics') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
          <Target size={32} className="text-dark-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No Data Yet</h2>
        <p className="text-dark-400 max-w-md mx-auto">
          Start tracking your habits to see detailed analytics and insights.
        </p>
      </div>
    );
  }

  // Dashboard empty state
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
        <Coffee size={40} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to Habit Tracker!</h2>
      <p className="text-dark-400 max-w-md mx-auto mb-6">
        Your journey to better habits starts here. Create your first habit to begin.
      </p>
      <button onClick={onAction} className="btn btn-primary btn-lg">
        <Plus size={20} />
        {actionLabel || 'Get Started'}
      </button>
    </div>
  );
};

export default EmptyState;
