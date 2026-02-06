import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for refresh token
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

// Request interceptor — read token from in-memory Zustand store (never localStorage)
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with refresh token flow
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no config or already retried, reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Don't retry refresh or logout endpoints
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Wait for the refresh to complete, then retry
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using httpOnly cookie
        const response = await api.post('/auth/refresh');
        const { token, user } = response.data.data;

        // Update in-memory store only
        useAuthStore.getState().login(user, token);

        // Process queued requests
        processQueue(null);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear auth state and let React Router redirect to login
        processQueue(refreshError as Error);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For 401 on auth endpoints or other errors, just reject
    if (error.response?.status === 401 && isAuthEndpoint) {
      // Don't redirect for auth endpoints, let the component handle it
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

/**
 * Attempt to restore session from httpOnly refresh token cookie.
 * Called once on app startup — if the cookie is valid, we get a new access token.
 */
export async function restoreSession(): Promise<boolean> {
  try {
    const response = await api.post('/auth/refresh');
    const { token, user } = response.data.data;
    useAuthStore.getState().login(user, token);
    return true;
  } catch {
    return false;
  }
}

export default api;
