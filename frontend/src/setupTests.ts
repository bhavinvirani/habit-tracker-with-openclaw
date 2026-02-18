// Polyfill TextEncoder/TextDecoder (needed by react-router v7 and other libs)
import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';

Object.assign(global, { TextEncoder, TextDecoder });

// ── Global module mocks ───────────────────────────────────────────────────────

// framer-motion → replace motion components with plain HTML elements
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: unknown, prop: string) => {
        const motionProps = new Set([
          'initial',
          'animate',
          'exit',
          'transition',
          'variants',
          'whileHover',
          'whileTap',
          'whileInView',
          'layout',
          'layoutId',
        ]);
        return React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
          const filtered: Record<string, unknown> = {};
          for (const key of Object.keys(props)) {
            if (!motionProps.has(key)) filtered[key] = props[key];
          }
          return React.createElement(prop as string, { ...filtered, ref });
        });
      },
    }
  );

  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useMotionValue: () => ({ set: jest.fn(), get: jest.fn(() => 0), on: jest.fn() }),
    useSpring: () => ({ set: jest.fn(), get: jest.fn(() => 0), on: jest.fn() }),
    useTransform: (value: unknown, fn?: (v: number) => number) => {
      if (typeof fn === 'function') return fn(0);
      return 0;
    },
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useInView: () => [null, true],
  };
});

// canvas-confetti → no-op
jest.mock('canvas-confetti', () => jest.fn());
jest.mock('./utils/confetti', () => ({ fireConfetti: jest.fn() }));

// recharts → stub chart components
jest.mock('recharts', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const stub = (name: string) =>
    function StubComponent(props: { children?: React.ReactNode }) {
      return React.createElement('div', { 'data-testid': `recharts-${name}` }, props.children);
    };
  return {
    ResponsiveContainer: stub('responsive-container'),
    LineChart: stub('line-chart'),
    Line: stub('line'),
    BarChart: stub('bar-chart'),
    Bar: stub('bar'),
    XAxis: stub('x-axis'),
    YAxis: stub('y-axis'),
    Tooltip: stub('tooltip'),
    CartesianGrid: stub('cartesian-grid'),
    Area: stub('area'),
    AreaChart: stub('area-chart'),
    PieChart: stub('pie-chart'),
    Pie: stub('pie'),
    Cell: stub('cell'),
    Legend: stub('legend'),
    RadialBarChart: stub('radial-bar-chart'),
    RadialBar: stub('radial-bar'),
    PolarAngleAxis: stub('polar-angle-axis'),
  };
});

// @tsparticles → no-op
jest.mock('@tsparticles/react', () => ({
  __esModule: true,
  default: () => null,
  initParticlesEngine: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@tsparticles/slim', () => ({ loadSlim: jest.fn() }));
jest.mock('@tsparticles/engine', () => ({}), { virtual: true });

// @vercel/analytics & speed-insights → no-op
jest.mock('@vercel/analytics/react', () => ({ Analytics: () => null }), { virtual: true });
jest.mock('@vercel/speed-insights/react', () => ({ SpeedInsights: () => null }), {
  virtual: true,
});

// react-hot-toast → capture calls
jest.mock('react-hot-toast', () => {
  const toast = jest.fn() as jest.Mock & {
    success: jest.Mock;
    error: jest.Mock;
    loading: jest.Mock;
    dismiss: jest.Mock;
    custom: jest.Mock;
  };
  toast.success = jest.fn();
  toast.error = jest.fn();
  toast.loading = jest.fn();
  toast.dismiss = jest.fn();
  toast.custom = jest.fn();
  return { __esModule: true, default: toast, toast };
});

// ── Browser API polyfills ─────────────────────────────────────────────────────

// matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});
