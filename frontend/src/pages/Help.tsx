import React, { useState } from 'react';
import {
  HelpCircle,
  CheckSquare,
  Calendar,
  BarChart3,
  BookOpen,
  Trophy,
  Flame,
  Target,
  Keyboard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Bell,
  LayoutDashboard,
  User,
  Moon,
  Pause,
  ArrowRight,
  RefreshCw,
  Filter,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../components/ui';

interface FeatureSection {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  features: {
    title: string;
    description: string;
    icon?: React.ElementType;
  }[];
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Your daily command center for tracking habits and monitoring progress.',
    features: [
      {
        title: "Today's Habits",
        description:
          'View and complete your habits for today. Check off habits as you complete them throughout the day.',
        icon: CheckSquare,
      },
      {
        title: 'Progress Overview',
        description:
          'See your daily completion rate, current streak, and total completions at a glance.',
        icon: TrendingUp,
      },
      {
        title: 'Weekly Heatmap',
        description: 'Visual representation of your habit completion over the past week.',
        icon: Calendar,
      },
      {
        title: 'Quick Stats',
        description:
          'Active habits count, current reading books, and active challenges displayed prominently.',
        icon: Sparkles,
      },
    ],
  },
  {
    id: 'habits',
    icon: CheckSquare,
    title: 'Habits',
    description: 'Create, manage, and track your daily, weekly, or monthly habits.',
    features: [
      {
        title: 'Create Habits',
        description:
          'Add new habits with custom names, descriptions, categories, frequencies, and reminder times.',
        icon: Plus,
      },
      {
        title: 'Categories',
        description:
          'Organize habits into categories: Health, Productivity, Learning, Mindfulness, Fitness, Social, and Creative.',
        icon: Filter,
      },
      {
        title: 'Frequency Options',
        description:
          'Set habits as daily, weekly, or monthly based on how often you want to practice them.',
        icon: Clock,
      },
      {
        title: 'Habit Stacking',
        description:
          'Link habits together by setting a "stack after" habit. Complete habits in sequence for better routine building.',
        icon: ArrowRight,
      },
      {
        title: 'Pause & Resume',
        description:
          'Temporarily pause habits when needed (vacation, illness) without breaking your streak data.',
        icon: Pause,
      },
      {
        title: 'Reminders',
        description:
          "Set reminder times for each habit to get notified when it's time to practice.",
        icon: Bell,
      },
      {
        title: 'Sparklines',
        description:
          'Mini charts showing your completion trend over the last 14 days for each habit.',
        icon: TrendingUp,
      },
    ],
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Calendar',
    description: 'Visualize your habit history and plan future completions.',
    features: [
      {
        title: 'Month View',
        description:
          'See the entire month with color-coded days showing your completion percentage.',
        icon: Calendar,
      },
      {
        title: 'Week View',
        description: 'Detailed weekly view showing individual habit completions for each day.',
        icon: Calendar,
      },
      {
        title: 'Day Details',
        description: 'Click any day to see which habits were completed and their completion times.',
        icon: Target,
      },
      {
        title: 'Color Coding',
        description:
          'Green for high completion (≥80%), yellow for medium (≥50%), red for low completion days.',
        icon: Sparkles,
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics',
    description: 'Deep insights into your habit performance and trends.',
    features: [
      {
        title: 'Completion Rate',
        description: 'Track your overall habit completion percentage with trend indicators.',
        icon: TrendingUp,
      },
      {
        title: 'Streak Tracking',
        description: 'Monitor your current streak and best streak records.',
        icon: Flame,
      },
      {
        title: 'Weekly Trends',
        description: 'Bar chart showing daily completions over the past week.',
        icon: BarChart3,
      },
      {
        title: 'Category Breakdown',
        description: "See which categories you're excelling at and which need more attention.",
        icon: Filter,
      },
      {
        title: 'Habit Performance',
        description:
          'Detailed metrics for each individual habit including completion rate and streaks.',
        icon: Target,
      },
    ],
  },
  {
    id: 'books',
    icon: BookOpen,
    title: 'Books',
    description: 'Track your reading progress and build a reading habit.',
    features: [
      {
        title: 'Add Books',
        description: 'Add books you want to read, are currently reading, or have completed.',
        icon: Plus,
      },
      {
        title: 'Reading Status',
        description: 'Track books as "Want to Read", "Currently Reading", or "Completed".',
        icon: BookOpen,
      },
      {
        title: 'Page Progress',
        description: 'Update your current page and see a visual progress bar toward completion.',
        icon: TrendingUp,
      },
      {
        title: 'Reading Stats',
        description: 'View total books, pages read, and books completed.',
        icon: BarChart3,
      },
      {
        title: 'Book Ratings',
        description: 'Rate completed books to remember your favorites.',
        icon: Sparkles,
      },
    ],
  },
  {
    id: 'challenges',
    icon: Trophy,
    title: 'Challenges',
    description: 'Set time-bound goals to push yourself with focused habit challenges.',
    features: [
      {
        title: 'Create Challenges',
        description: 'Set up 7, 14, 21, or 30-day challenges to build specific habits.',
        icon: Plus,
      },
      {
        title: 'Link Habits',
        description: 'Connect challenges to specific habits for automatic progress tracking.',
        icon: Target,
      },
      {
        title: 'Progress Tracking',
        description: "Visual progress bar and percentage showing how far you've come.",
        icon: TrendingUp,
      },
      {
        title: 'Challenge Status',
        description: 'View upcoming, active, completed, and failed challenges.',
        icon: Filter,
      },
      {
        title: 'Sync Progress',
        description: 'Automatically sync challenge progress based on linked habit completions.',
        icon: RefreshCw,
      },
      {
        title: 'Completion Rate',
        description: 'See your final success rate when a challenge ends.',
        icon: Trophy,
      },
    ],
  },
  {
    id: 'profile',
    icon: User,
    title: 'Profile',
    description: 'Manage your account settings and preferences.',
    features: [
      {
        title: 'Account Info',
        description: 'View and update your name, email, and profile picture.',
        icon: User,
      },
      {
        title: 'Timezone Settings',
        description: 'Set your timezone for accurate streak and daily reset calculations.',
        icon: Clock,
      },
      {
        title: 'Theme Preferences',
        description: 'Currently optimized for dark mode for reduced eye strain.',
        icon: Moon,
      },
      {
        title: 'Security',
        description: 'Change your password and manage account security.',
        icon: Zap,
      },
    ],
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ['?'], description: 'Open keyboard shortcuts modal' },
  { keys: ['N'], description: 'Create new habit' },
  { keys: ['D'], description: 'Go to Dashboard' },
  { keys: ['H'], description: 'Go to Habits' },
  { keys: ['C'], description: 'Go to Calendar' },
  { keys: ['A'], description: 'Go to Analytics' },
  { keys: ['B'], description: 'Go to Books' },
  { keys: ['T'], description: 'Go to Challenges' },
  { keys: ['P'], description: 'Go to Profile' },
  { keys: ['/', 'Ctrl+K'], description: 'Quick search (coming soon)' },
  { keys: ['Esc'], description: 'Close modals' },
];

const TIPS = [
  {
    icon: Flame,
    title: 'Start Small',
    description: 'Begin with 2-3 habits maximum. Add more as you build consistency.',
  },
  {
    icon: ArrowRight,
    title: 'Stack Your Habits',
    description:
      'Link habits together using habit stacking. "After I [HABIT A], I will [HABIT B]".',
  },
  {
    icon: Clock,
    title: 'Set Reminders',
    description: 'Use reminder times to get notifications and never miss a habit.',
  },
  {
    icon: Trophy,
    title: 'Use Challenges',
    description:
      'Create 21-day challenges to form new habits. Research shows 21 days helps cement routines.',
  },
  {
    icon: Pause,
    title: 'Pause When Needed',
    description:
      "Use the pause feature during vacations or illness. Don't break streaks unnecessarily.",
  },
  {
    icon: BarChart3,
    title: 'Review Analytics Weekly',
    description: 'Check your analytics every week to identify patterns and areas for improvement.',
  },
];

const Help: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('dashboard');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        subtitle="Learn how to use Habit Tracker effectively"
        icon={HelpCircle}
      />

      {/* Quick Tips Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="text-primary-500" size={20} />
          Quick Tips for Success
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIPS.map((tip, index) => (
            <div
              key={index}
              className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 hover:border-dark-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-500/10">
                  <tip.icon size={18} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">{tip.title}</h3>
                  <p className="text-dark-400 text-xs mt-1">{tip.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="text-primary-500" size={20} />
          Features Guide
        </h2>
        <div className="space-y-3">
          {FEATURE_SECTIONS.map((section) => (
            <div key={section.id} className="border border-dark-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-dark-800/50 hover:bg-dark-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-500/10">
                    <section.icon size={20} className="text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white">{section.title}</h3>
                    <p className="text-dark-400 text-sm">{section.description}</p>
                  </div>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp size={20} className="text-dark-400" />
                ) : (
                  <ChevronDown size={20} className="text-dark-400" />
                )}
              </button>
              {expandedSection === section.id && (
                <div className="p-4 bg-dark-900/50 border-t border-dark-700">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {section.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-dark-800/30 rounded-lg"
                      >
                        {feature.icon && (
                          <feature.icon
                            size={16}
                            className="text-primary-400 mt-0.5 flex-shrink-0"
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-white text-sm">{feature.title}</h4>
                          <p className="text-dark-400 text-xs mt-0.5">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Keyboard className="text-primary-500" size={20} />
          Keyboard Shortcuts
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700"
            >
              <span className="text-dark-300 text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    {keyIndex > 0 && <span className="text-dark-500 text-xs mx-1">or</span>}
                    <kbd className="px-2 py-1 text-xs font-mono bg-dark-700 rounded border border-dark-600 text-dark-300">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-dark-500 text-sm mt-4">
          Press{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-dark-700 rounded border border-dark-600">
            ?
          </kbd>{' '}
          anywhere in the app to view keyboard shortcuts.
        </p>
      </div>

      {/* Getting Started */}
      <div className="card bg-gradient-to-br from-primary-500/10 to-accent-purple/10 border-primary-500/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="text-primary-400" size={20} />
          Getting Started
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-medium text-white">Create Your First Habit</h3>
              <p className="text-dark-400 text-sm mt-1">
                Go to the Habits page and click "New Habit". Start with something simple like "Drink
                water" or "Read for 10 minutes".
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-medium text-white">Complete Habits Daily</h3>
              <p className="text-dark-400 text-sm mt-1">
                Check off habits on your Dashboard as you complete them. Watch your streak grow!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-medium text-white">Review Your Progress</h3>
              <p className="text-dark-400 text-sm mt-1">
                Use the Analytics page to see how you're doing. Identify patterns and optimize your
                routine.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-medium text-white">Challenge Yourself</h3>
              <p className="text-dark-400 text-sm mt-1">
                Once comfortable, create a 21-day challenge to cement your habits. Link it to a
                specific habit for automatic tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="text-primary-500" size={20} />
          Need More Help?
        </h2>
        <p className="text-dark-400 text-sm mb-4">
          If you have questions or feedback, we'd love to hear from you. This is an open-source
          project and contributions are welcome!
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            View on GitHub
          </a>
          <a href="mailto:support@habittracker.app" className="btn btn-ghost">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default Help;
