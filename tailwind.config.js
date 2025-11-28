import defaultTheme from 'tailwindcss/defaultTheme'
import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'vision-glass': '#fdfefe',
        'vision-glow': '#eef2ff',
        'vision-ink': '#0f172a',
        'soft-slate': '#94a3b8',
        'neon-mist': '#c7d2fe',
        'plasma-blue': '#4f46e5',
      },
      backgroundImage: {
        'vision-gradient':
          'radial-gradient(circle at top, rgba(255,255,255,0.9), rgba(226,232,255,0.55))',
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(248,250,255,0.35))',
      },
      boxShadow: {
        glass: '0 25px 65px -35px rgba(15,23,42,0.45)',
        float: '0 15px 45px -25px rgba(15,23,42,0.55)',
        glow: 'inset 0 0 0 1px rgba(255,255,255,0.6)',
      },
      dropShadow: {
        glow: ['0 0 20px rgba(79,70,229,0.35)', '0 15px 35px rgba(15,23,42,0.15)'],
      },
      transitionTimingFunction: {
        'fluid-elastic': 'cubic-bezier(0.25, 0.1, 0.0, 1)',
      },
    },
  },
  plugins: [forms],
}

