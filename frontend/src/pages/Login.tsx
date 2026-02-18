import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// ── Confetti burst helper ─────────────────────────────────────────────────────
const fireConfetti = () => {
  const colors = ['#2aa3ff', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors,
    startVelocity: 30,
    gravity: 1.2,
    ticks: 200,
  });

  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      startVelocity: 45,
      ticks: 200,
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      startVelocity: 45,
      ticks: 200,
    });
  }, 300);
};

// ── Spring configs ────────────────────────────────────────────────────────────
const magneticSpring = { stiffness: 150, damping: 15 };
const fieldSpring = { type: 'spring' as const, stiffness: 300, damping: 20 };

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoPhase, setDemoPhase] = useState<
    'idle' | 'typing-email' | 'typing-password' | 'submitting'
  >('idle');
  const formRef = useRef<HTMLFormElement>(null);

  // Magnetic hover
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, magneticSpring);
  const springY = useSpring(mouseY, magneticSpring);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.15);
    mouseY.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const typeIntoField = (
    text: string,
    field: 'email' | 'password',
    baseDelay = 50
  ): Promise<void> => {
    return new Promise((resolve) => {
      let i = 0;
      const next = () => {
        i++;
        setFormData((prev) => ({ ...prev, [field]: text.slice(0, i) }));
        if (i >= text.length) resolve();
        else setTimeout(next, baseDelay + Math.floor(Math.random() * 30) - 15);
      };
      setTimeout(next, baseDelay);
    });
  };

  const startDemo = async () => {
    if (isDemoMode || isLoading) return;

    setFormData({ email: '', password: '' });
    setErrors({});
    setIsDemoMode(true);

    await new Promise((r) => setTimeout(r, 300));

    setDemoPhase('typing-email');
    await typeIntoField('test@example.com', 'email');

    await new Promise((r) => setTimeout(r, 350));

    setDemoPhase('typing-password');
    await typeIntoField('password123', 'password');

    await new Promise((r) => setTimeout(r, 400));

    setDemoPhase('submitting');
    await new Promise((r) => setTimeout(r, 200));
    formRef.current?.requestSubmit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        ...formData,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      const { token, user } = response.data.data;
      login(user, token);
      toast.success(`Welcome back, ${user.name}!`);

      if (isDemoMode) {
        fireConfetti();
        await new Promise((r) => setTimeout(r, 1500));
      }

      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message: string } } } };
      const message = err.response?.data?.error?.message || 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsDemoMode(false);
      setDemoPhase('idle');
    }
  };

  const emailActive = demoPhase === 'typing-email';
  const passwordActive = demoPhase === 'typing-password';
  const isSubmitting = demoPhase === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-dark-400 mt-2">Sign in to continue building habits</p>
        </div>

        {/* Login Card */}
        <motion.div
          className="card"
          animate={
            isSubmitting
              ? { y: -4, boxShadow: '0 0 40px rgba(42, 163, 255, 0.2)' }
              : { y: 0, boxShadow: '0 0 0px rgba(42, 163, 255, 0)' }
          }
          transition={{ duration: 0.4 }}
        >
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="label">Email</label>
              <motion.div
                className="relative"
                animate={{ scale: emailActive ? 1.02 : 1 }}
                transition={fieldSpring}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <motion.div
                    animate={{
                      rotate: emailActive ? 15 : 0,
                      scale: emailActive ? 1.2 : 1,
                    }}
                    transition={fieldSpring}
                  >
                    <Mail
                      size={18}
                      className={`transition-colors duration-200 ${
                        emailActive ? 'text-primary-400' : 'text-dark-500'
                      }`}
                    />
                  </motion.div>
                </div>
                <input
                  type="email"
                  className={`input pl-10 transition-all duration-200 ${
                    errors.email ? 'input-error' : ''
                  } ${emailActive ? 'ring-2 ring-primary-500/50 border-primary-500' : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={isDemoMode}
                />
              </motion.div>
              {errors.email && <p className="text-accent-red text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password field */}
            <div>
              <label className="label">Password</label>
              <motion.div
                className="relative"
                animate={{ scale: passwordActive ? 1.02 : 1 }}
                transition={fieldSpring}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <motion.div
                    animate={{
                      rotate: passwordActive ? -15 : 0,
                      scale: passwordActive ? 1.2 : 1,
                    }}
                    transition={fieldSpring}
                  >
                    <Lock
                      size={18}
                      className={`transition-colors duration-200 ${
                        passwordActive ? 'text-primary-400' : 'text-dark-500'
                      }`}
                    />
                  </motion.div>
                </div>
                <input
                  type="password"
                  className={`input pl-10 transition-all duration-200 ${
                    errors.password ? 'input-error' : ''
                  } ${passwordActive ? 'ring-2 ring-primary-500/50 border-primary-500' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  readOnly={isDemoMode}
                />
              </motion.div>
              {errors.password && <p className="text-accent-red text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-dark-400 hover:text-primary-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
              animate={
                isSubmitting
                  ? {
                      scale: [1, 1.05, 1, 1.05, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(42,163,255,0)',
                        '0 0 30px 8px rgba(42,163,255,0.4)',
                        '0 0 0 0 rgba(42,163,255,0)',
                        '0 0 30px 8px rgba(42,163,255,0.4)',
                        '0 0 0 0 rgba(42,163,255,0)',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Demo Section */}
        <div className="mt-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-700" />
            </div>
            <span className="relative bg-dark-950 px-4 text-sm text-dark-500">or</span>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {!isDemoMode ? (
                <motion.button
                  key="demo-btn"
                  onClick={startDemo}
                  disabled={isLoading}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ x: springX, y: springY }}
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full z-10 cursor-pointer rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {/* Rotating gradient border */}
                  <div className="absolute -inset-[1px] rounded-xl overflow-hidden">
                    <motion.div
                      className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2"
                      style={{
                        background:
                          'conic-gradient(from 0deg, #2aa3ff, #8b5cf6, #ec4899, #06b6d4, #2aa3ff)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>

                  {/* Inner content */}
                  <div className="relative bg-dark-900 rounded-[11px] px-6 py-4 flex items-center gap-3">
                    <Sparkles size={20} className="text-primary-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-white text-sm">Try Demo Account</p>
                      <p className="text-dark-400 text-xs mt-0.5">
                        Explore with sample data — no signup needed
                      </p>
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="demo-active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 py-4"
                >
                  <Loader2 size={18} className="text-primary-400 animate-spin" />
                  <p className="text-dark-400 text-sm">Watch the magic happen...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
