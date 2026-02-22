/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme color palette
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#0a0f1a',
        },
        primary: {
          50: '#eef9ff',
          100: '#d8f1ff',
          200: '#b9e7ff',
          300: '#89d9ff',
          400: '#52c2ff',
          500: '#2aa3ff',
          600: '#1485f7',
          700: '#0d6de3',
          800: '#1258b8',
          900: '#154a91',
          950: '#122e58',
        },
        accent: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          purple: '#8b5cf6',
          pink: '#ec4899',
          cyan: '#06b6d4',
          orange: '#f97316',
          blue: '#3b82f6',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(42, 163, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(42, 163, 255, 0.2)',
      },
    },
  },
  plugins: [],
};
