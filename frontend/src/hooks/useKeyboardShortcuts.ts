import { useEffect, useCallback, useMemo, useRef } from 'react';
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

  // Use refs to avoid recreating shortcuts array on every render
  const onNewHabitRef = useRef(onNewHabit);
  const onSearchRef = useRef(onSearch);
  const onToggleHelpRef = useRef(onToggleHelp);

  // Update refs when callbacks change
  useEffect(() => {
    onNewHabitRef.current = onNewHabit;
    onSearchRef.current = onSearch;
    onToggleHelpRef.current = onToggleHelp;
  }, [onNewHabit, onSearch, onToggleHelp]);

  // Define all shortcuts with stable references
  const shortcuts: Shortcut[] = useMemo(
    () => [
      // Navigation shortcuts
      {
        key: 'g',
        description: 'Go to Dashboard',
        action: () => navigate('/'),
        scope: 'global' as const,
      },
      {
        key: 'h',
        description: 'Go to Habits',
        action: () => navigate('/habits'),
        scope: 'global' as const,
      },
      {
        key: 'c',
        description: 'Go to Calendar',
        action: () => navigate('/calendar'),
        scope: 'global' as const,
      },
      {
        key: 'a',
        description: 'Go to Analytics',
        action: () => navigate('/analytics'),
        scope: 'global' as const,
      },
      {
        key: 'b',
        description: 'Go to Books',
        action: () => navigate('/books'),
        scope: 'global' as const,
      },
      {
        key: 'p',
        description: 'Go to Profile',
        action: () => navigate('/profile'),
        scope: 'global' as const,
      },
      // Action shortcuts
      {
        key: 'n',
        description: 'New Habit',
        action: () => onNewHabitRef.current?.(),
        scope: 'global' as const,
      },
      {
        key: '/',
        description: 'Search',
        action: () => onSearchRef.current?.(),
        scope: 'global' as const,
      },
      {
        key: '?',
        description: 'Show Keyboard Shortcuts',
        action: () => onToggleHelpRef.current?.(),
        scope: 'global' as const,
      },
      {
        key: 'Escape',
        description: 'Close Modal / Cancel',
        action: () => {}, // Handled by individual modals
        scope: 'global' as const,
      },
    ],
    [navigate]
  );

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
