import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { FeatureFlagProvider } from '../../contexts/FeatureFlagContext';

interface ProvidersOptions {
  initialRoute?: string;
  withFeatureFlags?: boolean;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function AllProviders({
  children,
  initialRoute = '/',
  withFeatureFlags = false,
  queryClient,
}: ProvidersOptions & { children: React.ReactNode; queryClient: QueryClient }) {
  const content = withFeatureFlags ? (
    <FeatureFlagProvider>{children}</FeatureFlagProvider>
  ) : (
    children
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{content}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & ProvidersOptions
) {
  const { initialRoute, withFeatureFlags, ...renderOptions } = options || {};
  const queryClient = createTestQueryClient();
  const user = userEvent.setup();

  const result = render(ui, {
    wrapper: ({ children }) => (
      <AllProviders
        initialRoute={initialRoute}
        withFeatureFlags={withFeatureFlags}
        queryClient={queryClient}
      >
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });

  return { ...result, user, queryClient };
}

/** Render with authenticated user pre-seeded into Zustand */
export function renderAuthenticated(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & ProvidersOptions
) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      isAdmin: false,
    },
    token: 'mock-access-token',
    isAuthenticated: true,
    isInitialized: true,
  });

  return renderWithProviders(ui, options);
}

/** Render with admin user pre-seeded into Zustand */
export function renderAsAdmin(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & ProvidersOptions
) {
  useAuthStore.setState({
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    },
    token: 'mock-admin-token',
    isAuthenticated: true,
    isInitialized: true,
  });

  return renderWithProviders(ui, options);
}

/** Reset auth store to initial state between tests */
export function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false,
  });
}
