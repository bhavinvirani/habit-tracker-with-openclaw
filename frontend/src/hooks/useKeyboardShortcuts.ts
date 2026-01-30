import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  scope?: 'global' | 'dashboard' | 'habits' | 'books';
}

interface UseKeyboardShortcutsOptions {
  onNewHabit?: () => void;
  onSearch?: () => void;
  onToggleHelp?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { onNewHabit, onSearch, onToggleHelp, enabled = true } = options;

  // Define all shortcuts
  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      key: 'g',
      description: 'Go to Dashboard',
      action: () => navigate('/'),
      scope: 'global',
    },
    {
      key: 'h',
      description: 'Go to Habits',
      action: () => navigate('/habits'),
      scope: 'global',
    },
    {
      key: 'c',
      description: 'Go to Calendar',
      action: () => navigate('/calendar'),
      scope: 'global',
    },
    {
      key: 'a',
      description: 'Go to Analytics',
      action: () => navigate('/analytics'),
      scope: 'global',
    },
    {
      key: 'b',
      description: 'Go to Books',
      action: () => navigate('/books'),
      scope: 'global',
    },
    {
      key: 'p',
      description: 'Go to Profile',
      action: () => navigate('/profile'),
      scope: 'global',
    },
    // Action shortcuts
    {
      key: 'n',
      description: 'New Habit',
      action: () => onNewHabit?.(),
      scope: 'global',
    },
    {
      key: '/',
      description: 'Search',
      action: () => onSearch?.(),
      scope: 'global',
    },
    {
      key: '?',
      description: 'Show Keyboard Shortcuts',
      action: () => onToggleHelp?.(),
      scope: 'global',
    },
    {
      key: 'Escape',
      description: 'Close Modal / Cancel',
      action: () => {}, // Handled by individual modals
      scope: 'global',
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInputFocused && event.key !== 'Escape') return;

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = s.ctrlKey
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const altMatch = s.altKey ? event.altKey : !event.altKey;
        // Only check shift if explicitly required, otherwise ignore it
        const shiftMatch = s.shiftKey ? event.shiftKey : true;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        // Check scope
        if (shortcut.scope === 'global' || location.pathname.includes(shortcut.scope || '')) {
          event.preventDefault();
          shortcut.action();
        }
      }
    },
    [enabled, shortcuts, location.pathname]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
};

// Shortcut display helper
export const formatShortcut = (shortcut: Shortcut): string => {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push('⌘');
  if (shortcut.altKey) parts.push('⌥');
  if (shortcut.shiftKey) parts.push('⇧');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' ');
};
