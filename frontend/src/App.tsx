import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Books from './pages/Books';
import Challenges from './pages/Challenges';
import Login from './pages/Login';
import Register from './pages/Register';
import ApiDocs from './pages/ApiDocs';
import IntegrationDocs from './pages/IntegrationDocs';
import Help from './pages/Help';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <ErrorBoundary>
                <Login />
              </ErrorBoundary>
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <ErrorBoundary>
                <Register />
              </ErrorBoundary>
            )
          }
        />
        <Route
          path="/docs/api"
          element={
            <ErrorBoundary>
              <ApiDocs />
            </ErrorBoundary>
          }
        />
        <Route
          path="/docs/integration"
          element={
            <ErrorBoundary>
              <IntegrationDocs />
            </ErrorBoundary>
          }
        />

        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route
            index
            element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            }
          />
          <Route
            path="habits"
            element={
              <ErrorBoundary>
                <Habits />
              </ErrorBoundary>
            }
          />
          <Route
            path="calendar"
            element={
              <ErrorBoundary>
                <Calendar />
              </ErrorBoundary>
            }
          />
          <Route
            path="analytics"
            element={
              <ErrorBoundary>
                <Analytics />
              </ErrorBoundary>
            }
          />
          <Route
            path="books"
            element={
              <ErrorBoundary>
                <Books />
              </ErrorBoundary>
            }
          />
          <Route
            path="challenges"
            element={
              <ErrorBoundary>
                <Challenges />
              </ErrorBoundary>
            }
          />
          <Route
            path="profile"
            element={
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            }
          />
          <Route
            path="help"
            element={
              <ErrorBoundary>
                <Help />
              </ErrorBoundary>
            }
          />
        </Route>
      </Routes>
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
    </ErrorBoundary>
  );
}

export default App;
