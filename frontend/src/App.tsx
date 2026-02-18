import React, { Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import { LoadingSpinner } from './components/ui';
import { useAuthStore } from './store/authStore';
import { restoreSession } from './services/api';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

// Lazy-loaded pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Habits = React.lazy(() => import('./pages/Habits'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Books = React.lazy(() => import('./pages/Books'));
const Challenges = React.lazy(() => import('./pages/Challenges'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const ApiDocs = React.lazy(() => import('./pages/ApiDocs'));
const IntegrationDocs = React.lazy(() => import('./pages/IntegrationDocs'));
const Help = React.lazy(() => import('./pages/Help'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Admin = React.lazy(() => import('./pages/Admin'));

const SuspensePage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
  </ErrorBoundary>
);

function App() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const initRef = useRef(false);

  // Restore session from httpOnly refresh token cookie on app startup.
  // The ref guard prevents StrictMode double-mount from firing two concurrent
  // restoreSession() calls — the backend rotates the refresh token on each call,
  // so a second in-flight request with the same (now-deleted) token would fail.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      await restoreSession();
      useAuthStore.getState().setInitialized();
    };
    init();
  }, []);

  // Show loading screen while restoring session
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <FeatureFlagProvider>
        <Routes>
          <Route element={!isAuthenticated ? <AuthLayout /> : <Navigate to="/" />}>
            <Route
              path="/login"
              element={
                <SuspensePage>
                  <Login />
                </SuspensePage>
              }
            />
            <Route
              path="/register"
              element={
                <SuspensePage>
                  <Register />
                </SuspensePage>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <SuspensePage>
                  <ForgotPassword />
                </SuspensePage>
              }
            />
            <Route
              path="/reset-password"
              element={
                <SuspensePage>
                  <ResetPassword />
                </SuspensePage>
              }
            />
          </Route>
          <Route
            path="/docs/api"
            element={
              <SuspensePage>
                <ApiDocs />
              </SuspensePage>
            }
          />
          <Route
            path="/docs/integration"
            element={
              <SuspensePage>
                <IntegrationDocs />
              </SuspensePage>
            }
          />

          <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route
              index
              element={
                <SuspensePage>
                  <Dashboard />
                </SuspensePage>
              }
            />
            <Route
              path="habits"
              element={
                <SuspensePage>
                  <Habits />
                </SuspensePage>
              }
            />
            <Route
              path="calendar"
              element={
                <SuspensePage>
                  <Calendar />
                </SuspensePage>
              }
            />
            <Route
              path="analytics"
              element={
                <SuspensePage>
                  <Analytics />
                </SuspensePage>
              }
            />
            <Route
              path="books"
              element={
                <SuspensePage>
                  <Books />
                </SuspensePage>
              }
            />
            <Route
              path="challenges"
              element={
                <SuspensePage>
                  <Challenges />
                </SuspensePage>
              }
            />
            <Route
              path="profile"
              element={
                <SuspensePage>
                  <Profile />
                </SuspensePage>
              }
            />
            <Route
              path="help"
              element={
                <SuspensePage>
                  <Help />
                </SuspensePage>
              }
            />
            <Route
              path="admin"
              element={
                <SuspensePage>
                  <Admin />
                </SuspensePage>
              }
            />
            <Route
              path="*"
              element={
                <SuspensePage>
                  <NotFound />
                </SuspensePage>
              }
            />
          </Route>

          {/* Unauthenticated users on unknown paths go to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        <VercelAnalytics />
        <SpeedInsights />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '12px',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#1e293b',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#1e293b',
              },
            },
          }}
        />
      </FeatureFlagProvider>
    </ErrorBoundary>
  );
}

export default App;
