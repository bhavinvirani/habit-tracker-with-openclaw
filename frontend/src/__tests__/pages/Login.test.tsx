import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import Login from '../../pages/Login';
import { renderWithProviders, resetAuthStore } from '../helpers/renderWithProviders';
import { useAuthStore } from '../../store/authStore';

// Mock axios-based api module
const mockPost = jest.fn();
jest.mock('../../services/api', () => {
  return {
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
    restoreSession: jest.fn(),
  };
});

beforeEach(() => {
  resetAuthStore();
  jest.clearAllMocks();
});

// Helper: fill Login form using fireEvent.change (single event with full value)
// Needed because Login uses closure-based setState which doesn't accumulate
// with user.type under React 18 automatic batching.
function fillLoginForm(email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: password },
  });
}

describe('Login Page', () => {
  it('renders email and password fields and sign in button', () => {
    renderWithProviders(<Login />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    const { user } = renderWithProviders(<Login />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const { user } = renderWithProviders(<Login />);
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'notanemail' },
    });
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    const { user } = renderWithProviders(<Login />);
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('successful login calls API and stores token', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: 'mock-token',
          user: { id: 'user-1', name: 'Test User', email: 'test@example.com', isAdmin: false },
        },
      },
    });

    const { user } = renderWithProviders(<Login />);

    fillLoginForm('test@example.com', 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/auth/login',
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('mock-token');
    });
  });

  it('failed login shows error toast', async () => {
    const toast = require('react-hot-toast').default;
    mockPost.mockRejectedValueOnce({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });

    const { user } = renderWithProviders(<Login />);

    fillLoginForm('test@example.com', 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('has link to register page', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Sign up').closest('a')).toHaveAttribute('href', '/register');
  });

  it('has link to forgot password page', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText('Forgot password?').closest('a')).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('submit button is disabled while loading', async () => {
    // Make the API call hang
    mockPost.mockReturnValue(new Promise(() => {}));

    const { user } = renderWithProviders(<Login />);

    fillLoginForm('test@example.com', 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const form = screen.getByPlaceholderText('you@example.com').closest('form')!;
      const submitButton = form.querySelector('button[type="submit"]')!;
      expect(submitButton).toBeDisabled();
    });
  });
});
