import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, Navigate, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { resetAuthStore } from '../helpers/renderWithProviders';

// Mock api module
const mockPost = jest.fn();
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    get: jest.fn(),
    create: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  restoreSession: jest.fn().mockResolvedValue(undefined),
}));

// Minimal page stubs for integration testing
const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const api = require('../../services/api').default;
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      login(user, token);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message: string } } } };
      setError(e.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Sign In</button>
      {error && <p>{error}</p>}
    </form>
  );
};

const DashboardPage: React.FC = () => {
  const { logout } = useAuthStore();
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

// Simplified App with same auth guard logic as the real App
const TestApp: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
    </Routes>
  );
};

function renderApp(initialRoute = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });

  const user = userEvent.setup();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <TestApp />
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { ...result, user };
}

beforeEach(() => {
  resetAuthStore();
  jest.clearAllMocks();
});

describe('Auth Flow Integration', () => {
  it('unauthenticated user sees login page', () => {
    renderApp('/login');
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('unauthenticated user on protected route is redirected to login', () => {
    renderApp('/');
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('authenticated user on login route is redirected to dashboard', () => {
    useAuthStore.setState({
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com', isAdmin: false },
      token: 'mock-token',
      isAuthenticated: true,
    });

    renderApp('/login');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('after login, user is redirected to dashboard', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: 'mock-token',
          user: { id: 'user-1', name: 'Test User', email: 'test@example.com', isAdmin: false },
        },
      },
    });

    const { user } = renderApp('/login');

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('mock-token');
  });

  it('after logout, user is redirected to login', async () => {
    // Start authenticated
    useAuthStore.setState({
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com', isAdmin: false },
      token: 'mock-token',
      isAuthenticated: true,
    });

    const { user } = renderApp('/');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /logout/i }));

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('login error displays error message', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });

    const { user } = renderApp('/login');

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    });
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // User should still be on login page
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
