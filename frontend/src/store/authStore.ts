import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  timezone?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setInitialized: () => void;
}

// Access token stored in memory only — never persisted to localStorage.
// Session is restored on page load via httpOnly refresh token cookie.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  setInitialized: () => set({ isInitialized: true }),
}));
