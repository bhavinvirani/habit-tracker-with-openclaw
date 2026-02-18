import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  FeatureFlagProvider,
  useFeatureFlags,
  FeatureGate,
} from '../../../contexts/FeatureFlagContext';
import { useAuthStore } from '../../../store/authStore';

// Mock the features API
jest.mock('../../../services/features', () => ({
  featuresApi: {
    getEnabledFeatures: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { featuresApi } = require('../../../services/features');

const initialAuthState = useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState(initialAuthState);
  jest.clearAllMocks();
});

function TestConsumer() {
  const { enabledFeatures, isEnabled, isLoading } = useFeatureFlags();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="features">{enabledFeatures.join(',')}</span>
      <span data-testid="ai-enabled">{String(isEnabled('ai_insights'))}</span>
    </div>
  );
}

describe('FeatureFlagContext', () => {
  describe('useFeatureFlags', () => {
    it('returns defaults when unauthenticated', async () => {
      useAuthStore.setState({ isAuthenticated: false });

      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('features')).toHaveTextContent('');
      expect(screen.getByTestId('ai-enabled')).toHaveTextContent('false');
    });

    it('fetches features when authenticated', async () => {
      featuresApi.getEnabledFeatures.mockResolvedValue(['ai_insights', 'dark_mode']);
      useAuthStore.setState({ isAuthenticated: true });

      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('features')).toHaveTextContent('ai_insights,dark_mode');
      expect(screen.getByTestId('ai-enabled')).toHaveTextContent('true');
    });

    it('handles fetch error gracefully', async () => {
      featuresApi.getEnabledFeatures.mockRejectedValue(new Error('Network error'));
      useAuthStore.setState({ isAuthenticated: true });

      render(
        <FeatureFlagProvider>
          <TestConsumer />
        </FeatureFlagProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('features')).toHaveTextContent('');
    });
  });

  describe('FeatureGate', () => {
    it('renders children when flag is enabled', async () => {
      featuresApi.getEnabledFeatures.mockResolvedValue(['ai_insights']);
      useAuthStore.setState({ isAuthenticated: true });

      render(
        <FeatureFlagProvider>
          <FeatureGate flag="ai_insights">
            <span>AI Feature</span>
          </FeatureGate>
        </FeatureFlagProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('AI Feature')).toBeInTheDocument();
      });
    });

    it('renders nothing when flag is disabled', async () => {
      featuresApi.getEnabledFeatures.mockResolvedValue([]);
      useAuthStore.setState({ isAuthenticated: true });

      render(
        <FeatureFlagProvider>
          <FeatureGate flag="ai_insights">
            <span>AI Feature</span>
          </FeatureGate>
        </FeatureFlagProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('AI Feature')).not.toBeInTheDocument();
      });
    });

    it('renders nothing while loading', () => {
      featuresApi.getEnabledFeatures.mockReturnValue(new Promise(() => {})); // never resolves
      useAuthStore.setState({ isAuthenticated: true });

      render(
        <FeatureFlagProvider>
          <FeatureGate flag="ai_insights">
            <span>AI Feature</span>
          </FeatureGate>
        </FeatureFlagProvider>
      );

      expect(screen.queryByText('AI Feature')).not.toBeInTheDocument();
    });
  });
});
