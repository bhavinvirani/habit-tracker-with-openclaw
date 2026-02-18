import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

type PageState = 'validating' | 'form' | 'invalid' | 'success';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const validatedRef = useRef(false);

  const [pageState, setPageState] = useState<PageState>(token ? 'validating' : 'invalid');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // Validate token on mount
  useEffect(() => {
    if (!token || validatedRef.current) return;
    validatedRef.current = true;

    api
      .post('/auth/validate-reset-token', { token })
      .then(() => setPageState('form'))
      .catch(() => setPageState('invalid'));
  }, [token]);

  // Auto-redirect to login after successful reset
  useEffect(() => {
    if (pageState !== 'success') return;
    const timer = setTimeout(() => navigate('/login'), 3000);
    return () => clearTimeout(timer);
  }, [pageState, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: formData.password,
      });
      setPageState('success');
      toast.success('Password reset successfully!');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message: string; code?: string } } };
      };
      const message = error.response?.data?.error?.message || 'Failed to reset password';
      if (error.response?.data?.error?.code === 'AUTHENTICATION_ERROR') {
        setPageState('invalid');
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading / validating token
  if (pageState === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md relative z-10 text-center">
          <Loader2 size={32} className="text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid / expired / used token
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Invalid Reset Link</h1>
          </div>
          <div className="card text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-red/10 mb-4">
              <AlertCircle size={32} className="text-accent-red" />
            </div>
            <p className="text-dark-300 mb-6">
              This password reset link is invalid, expired, or has already been used. Please request
              a new one.
            </p>
            <Link to="/forgot-password" className="btn btn-primary inline-flex">
              Request New Link
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {pageState === 'success' ? 'Password Reset' : 'Set New Password'}
          </h1>
          <p className="text-dark-400 mt-2">
            {pageState === 'success'
              ? 'Your password has been updated'
              : 'Choose a strong new password'}
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {pageState === 'success' ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green/10 mb-4">
                <CheckCircle size={32} className="text-accent-green" />
              </div>
              <p className="text-dark-300 mb-2">
                Your password has been reset successfully. All previous sessions have been signed
                out.
              </p>
              <p className="text-dark-500 text-sm mb-6">Redirecting to sign in...</p>
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                  />
                  <input
                    type="password"
                    className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                {errors.password && (
                  <p className="text-accent-red text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                  />
                  <input
                    type="password"
                    className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-accent-red text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
