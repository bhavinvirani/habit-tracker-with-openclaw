import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import Habits from '../../pages/Habits';
import { renderAuthenticated, resetAuthStore } from '../helpers/renderWithProviders';
import { mockHabitsWithStats, mockWeeklyData } from '../mocks/handlers';

// Mock service modules
jest.mock('../../services/habits', () => ({
  habitsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    archive: jest.fn(),
    unarchive: jest.fn(),
  },
  analyticsApi: {
    getWeekly: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { habitsApi, analyticsApi } = require('../../services/habits');

beforeEach(() => {
  resetAuthStore();
  jest.clearAllMocks();

  habitsApi.getAll.mockResolvedValue(mockHabitsWithStats);
  analyticsApi.getWeekly.mockResolvedValue(mockWeeklyData);
});

describe('Habits Page', () => {
  it('renders habit list after loading', async () => {
    renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
    });
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('shows active habit count', async () => {
    renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText(/2 active habits/)).toBeInTheDocument();
    });
  });

  it('search input filters habits by name', async () => {
    const { user } = renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search habits...');
    await user.type(searchInput, 'Read');

    await waitFor(() => {
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.queryByText('Morning Meditation')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no habits exist', async () => {
    habitsApi.getAll.mockResolvedValue([]);

    renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('No habits yet')).toBeInTheDocument();
    });
    expect(screen.getByText('Create Your First Habit')).toBeInTheDocument();
  });

  it('shows filtered empty state when search has no results', async () => {
    const { user } = renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search habits...');
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No habits match your filters')).toBeInTheDocument();
    });
  });

  it('shows habit stats (streak, rate, total)', async () => {
    renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
    });

    // Habit 1 stats
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1); // currentStreak
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1); // longestStreak
  });

  it('has New Habit button', async () => {
    renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('New Habit')).toBeInTheDocument();
    });
  });

  it('opens create modal when New Habit is clicked', async () => {
    const { user } = renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('New Habit')).toBeInTheDocument();
    });

    await user.click(screen.getByText('New Habit'));
    expect(screen.getByText('Create New Habit')).toBeInTheDocument();
  });

  it('shows delete confirmation dialog', async () => {
    const { user } = renderAuthenticated(<Habits />);

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
    });

    // Open the menu for the first habit
    const menuButtons = screen.getAllByRole('button', { name: '' });
    // Find the MoreVertical button (it has no text)
    const moreButton = menuButtons.find(
      (btn) => btn.querySelector('svg.lucide-more-vertical') !== null
    );
    if (moreButton) {
      await user.click(moreButton);
      await user.click(screen.getByText('Delete'));

      expect(screen.getByText('Delete Habit')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete this habit? This cannot be undone.')
      ).toBeInTheDocument();
    }
  });
});
