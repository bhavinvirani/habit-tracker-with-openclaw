import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message: string } } } };
      toast.error(error.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isSuccess ? 'Check Your Email' : 'Forgot Password'}
          </h1>
          <p className="text-dark-400 mt-2">
            {isSuccess
              ? 'We sent you a password reset link'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green/10 mb-4">
                <CheckCircle size={32} className="text-accent-green" />
              </div>
              <p className="text-dark-300 mb-6">
                If an account exists for <span className="text-white font-medium">{email}</span>,
                you&apos;ll receive a password reset link shortly. The link expires in 15 minutes.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                    />
                    <input
                      type="email"
                      className={`input pl-10 ${error ? 'input-error' : ''}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-accent-red text-sm mt-1">{error}</p>}
                </div>

                <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-dark-400">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
