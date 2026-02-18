import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import Dashboard from '../../pages/Dashboard';
import { renderAuthenticated, resetAuthStore } from '../helpers/renderWithProviders';
import {
  mockTodayResponse,
  mockOverviewStats,
  mockWeeklyData,
  mockCurrentBook,
} from '../mocks/handlers';

// Mock all service modules
jest.mock('../../services/habits', () => ({
  trackingApi: {
    getToday: jest.fn(),
    checkIn: jest.fn(),
    undo: jest.fn(),
  },
  analyticsApi: {
    getOverview: jest.fn(),
    getWeekly: jest.fn(),
  },
  habitsApi: {
    create: jest.fn(),
  },
  booksApi: {
    getCurrentlyReading: jest.fn(),
    updateProgress: jest.fn(),
  },
}));

jest.mock('../../services/reports', () => ({
  reportsApi: {
    getLatest: jest.fn(),
  },
}));

jest.mock('../../services/features', () => ({
  featuresApi: {
    getEnabledFeatures: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { trackingApi, analyticsApi, booksApi } = require('../../services/habits');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { reportsApi } = require('../../services/reports');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { featuresApi } = require('../../services/features');

beforeEach(() => {
  resetAuthStore();
  jest.clearAllMocks();

  // Default happy-path mocks
  trackingApi.getToday.mockResolvedValue(mockTodayResponse);
  analyticsApi.getOverview.mockResolvedValue(mockOverviewStats);
  analyticsApi.getWeekly.mockResolvedValue(mockWeeklyData);
  booksApi.getCurrentlyReading.mockResolvedValue(mockCurrentBook);
  reportsApi.getLatest.mockResolvedValue(null);
  featuresApi.getEnabledFeatures.mockResolvedValue([]);
});

describe('Dashboard Page', () => {
  it('renders overview stat cards after loading', async () => {
    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
    });

    expect(screen.getByText('Best Streak')).toBeInTheDocument();
    // Stat values may appear in multiple elements (e.g. heatmap days), so verify via label context
    expect(screen.getByText('21')).toBeInTheDocument(); // longestEverStreak
  });

  it("displays today's habit list", async () => {
    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
    });
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('shows progress ring with correct data', async () => {
    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Today's Progress")).toBeInTheDocument();
    });
    expect(screen.getByText(/0 of 2 habits done/)).toBeInTheDocument();
  });

  it('shows empty state when no habits exist', async () => {
    trackingApi.getToday.mockResolvedValue({
      ...mockTodayResponse,
      habits: [],
      summary: { total: 0, completed: 0, remaining: 0 },
    });

    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Start your journey')).toBeInTheDocument();
    });
    expect(screen.getByText('Create Your First Habit')).toBeInTheDocument();
  });

  it('shows currently reading book widget', async () => {
    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Atomic Habits')).toBeInTheDocument();
    });
    expect(screen.getByText('James Clear')).toBeInTheDocument();
  });

  it('shows no-book message when no current book', async () => {
    booksApi.getCurrentlyReading.mockResolvedValue(null);

    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No book in progress/)).toBeInTheDocument();
    });
  });

  it('shows daily habits section with progress', async () => {
    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Habits')).toBeInTheDocument();
    });
  });

  it('shows numeric habit progress bar', async () => {
    renderAuthenticated(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/10\/30/)).toBeInTheDocument(); // Read habit progress
    });
  });
});
