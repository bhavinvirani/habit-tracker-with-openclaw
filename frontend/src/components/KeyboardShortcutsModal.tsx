import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Navigation',
      shortcuts: [
        { key: 'G', description: 'Go to Dashboard' },
        { key: 'H', description: 'Go to Habits' },
        { key: 'C', description: 'Go to Calendar' },
        { key: 'A', description: 'Go to Analytics' },
        { key: 'B', description: 'Go to Books' },
        { key: 'P', description: 'Go to Profile' },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { key: 'N', description: 'Create new habit' },
        { key: '/', description: 'Focus search' },
        { key: '?', description: 'Show keyboard shortcuts' },
        { key: 'ESC', description: 'Close modal / Cancel' },
      ],
    },
    {
      title: 'Dashboard',
      shortcuts: [
        { key: 'SPACE', description: 'Complete focused habit' },
        { key: '↑ ↓', description: 'Navigate habits' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Keyboard size={20} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-dark-400">Navigate faster with your keyboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Shortcuts */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-700/50"
                  >
                    <span className="text-dark-300">{shortcut.description}</span>
                    <kbd className="px-2.5 py-1 text-xs font-mono font-medium bg-dark-900 border border-dark-600 rounded-md text-dark-300 shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 bg-dark-900/50 rounded-b-2xl">
          <p className="text-center text-sm text-dark-500">
            Press{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-dark-800 border border-dark-600 rounded">
              ?
            </kbd>{' '}
            to toggle this menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
