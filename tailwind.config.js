import defaultTheme from 'tailwindcss/defaultTheme'
import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'vision-glass': '#fdfefe',
        'vision-glow': '#eef2ff',
        'vision-ink': '#0f172a',
        'soft-slate': '#94a3b8',
        'neon-mist': '#c7d2fe',
        'plasma-blue': '#4f46e5',
        'plasma-indigo': '#6366f1',
        'plasma-violet': '#8b5cf6',
      },
      backgroundImage: {
        'vision-gradient':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,119,198,0.15), transparent), radial-gradient(circle at top, rgba(255,255,255,0.95), rgba(226,232,255,0.65))',
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,255,0.4))',
        'glass-shimmer': 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.5) 50%, transparent 75%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, rgba(79,70,229,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(139,92,246,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(99,102,241,0.05) 0px, transparent 50%)',
        'aurora': 'linear-gradient(135deg, rgba(79,70,229,0.03) 0%, rgba(139,92,246,0.05) 50%, rgba(99,102,241,0.03) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(15,23,42,0.08), 0 0 0 1px rgba(255,255,255,0.6)',
        'glass-hover': '0 16px 48px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.8)',
        'glass-inset': 'inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(255,255,255,0.3)',
        'float': '0 20px 60px -20px rgba(15,23,42,0.25)',
        'float-lg': '0 30px 80px -30px rgba(15,23,42,0.3)',
        'glow': '0 0 40px -10px rgba(79,70,229,0.4)',
        'glow-sm': '0 0 20px -5px rgba(79,70,229,0.3)',
        'inner-glow': 'inset 0 0 20px rgba(255,255,255,0.5)',
        'soft': '0 2px 8px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)',
      },
      dropShadow: {
        'glow': ['0 0 25px rgba(79,70,229,0.4)', '0 20px 40px rgba(15,23,42,0.12)'],
        'glow-lg': ['0 0 35px rgba(79,70,229,0.5)', '0 25px 50px rgba(15,23,42,0.15)'],
      },
      transitionTimingFunction: {
        'fluid-elastic': 'cubic-bezier(0.25, 0.1, 0.0, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px -5px rgba(79,70,229,0.3)' },
          '50%': { boxShadow: '0 0 30px -5px rgba(79,70,229,0.5)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        '3xl': '64px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [forms],
}

