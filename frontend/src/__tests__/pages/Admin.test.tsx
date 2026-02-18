import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import Admin from '../../pages/Admin';
import { renderAuthenticated, renderAsAdmin, resetAuthStore } from '../helpers/renderWithProviders';
import { mockFeatureFlags } from '../mocks/handlers';

// Mock service modules
jest.mock('../../services/features', () => ({
  featuresApi: {
    getEnabledFeatures: jest.fn(),
    getAllFlags: jest.fn(),
    updateFlag: jest.fn(),
    createFlag: jest.fn(),
    deleteFlag: jest.fn(),
  },
}));

jest.mock('../../services/reports', () => ({
  reportsApi: {
    generateReports: jest.fn(),
  },
}));

jest.mock('../../services/admin', () => ({
  adminApi: {
    getStats: jest.fn(),
    getUsers: jest.fn(),
    getAuditLog: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { featuresApi } = require('../../services/features');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { reportsApi } = require('../../services/reports');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { adminApi } = require('../../services/admin');

beforeEach(() => {
  resetAuthStore();
  jest.clearAllMocks();

  featuresApi.getEnabledFeatures.mockResolvedValue(['ai_insights']);
  featuresApi.getAllFlags.mockResolvedValue(mockFeatureFlags);
  featuresApi.updateFlag.mockResolvedValue(mockFeatureFlags[0]);
  reportsApi.generateReports.mockResolvedValue({
    usersProcessed: 5,
    usersSkipped: 2,
    errors: [],
  });
  adminApi.getStats.mockResolvedValue({
    totalUsers: 10,
    totalHabits: 25,
    activeUsersLast7Days: 8,
    completionRateAvg: 72,
  });
  adminApi.getUsers.mockResolvedValue({ users: [], total: 0 });
  adminApi.getAuditLog.mockResolvedValue({ entries: [], total: 0 });
});

describe('Admin Page', () => {
  it('redirects non-admin users', () => {
    renderAuthenticated(<Admin />, { withFeatureFlags: true });
    // Non-admin should be redirected — the Navigate component renders nothing visible
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('renders admin dashboard header', async () => {
    renderAsAdmin(<Admin />, { withFeatureFlags: true });

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('shows tab navigation', async () => {
    renderAsAdmin(<Admin />, { withFeatureFlags: true });

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('AI Reports')).toBeInTheDocument();
  });

  it('renders feature flags list when flags tab is clicked', async () => {
    const { user } = renderAsAdmin(<Admin />, { withFeatureFlags: true });

    // Click the Feature Flags tab
    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Feature Flags'));

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('shows flag keys as code badges', async () => {
    const { user } = renderAsAdmin(<Admin />, { withFeatureFlags: true });

    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Feature Flags'));

    await waitFor(() => {
      expect(screen.getByText('ai_insights')).toBeInTheDocument();
    });
    expect(screen.getByText('dark_mode')).toBeInTheDocument();
  });

  it('toggles flag when toggle button is clicked', async () => {
    const { user } = renderAsAdmin(<Admin />, { withFeatureFlags: true });

    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Feature Flags'));

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });

    // Find the toggle button for AI Insights
    const toggleButton = screen.getByLabelText('Toggle AI Insights');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(featuresApi.updateFlag).toHaveBeenCalledWith('ai_insights', { enabled: false });
    });
  });

  it('search filters flags', async () => {
    const { user } = renderAsAdmin(<Admin />, { withFeatureFlags: true });

    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Feature Flags'));

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search flags/i);
    await user.type(searchInput, 'dark');

    await waitFor(() => {
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      expect(screen.queryByText('AI Insights')).not.toBeInTheDocument();
    });
  });

  it('triggers report generation on AI Reports tab', async () => {
    const { user } = renderAsAdmin(<Admin />, { withFeatureFlags: true });

    await waitFor(() => {
      expect(screen.getByText('AI Reports')).toBeInTheDocument();
    });
    await user.click(screen.getByText('AI Reports'));

    await waitFor(() => {
      expect(screen.getByText('Generate Reports')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Generate Reports'));

    await waitFor(() => {
      expect(reportsApi.generateReports).toHaveBeenCalled();
    });
  });
});
