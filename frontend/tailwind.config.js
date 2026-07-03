/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Light mode (pink) ─────────────────────────────────────────
        pink: {
          50:  '#FFF0F7',
          100: '#FFE4F0',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
        // ── Dark mode (blue) ──────────────────────────────────────────
        blue: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // ── Semantic surface tokens ───────────────────────────────────
        surface: {
          light: '#FFF7FB',
          dark:  '#0F172A',
        },
        card: {
          light: '#FFFFFF',
          dark:  '#1E293B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'pink-sm':  '0 1px 3px rgba(236,72,153,0.10), 0 1px 2px rgba(236,72,153,0.06)',
        'pink-md':  '0 4px 12px rgba(236,72,153,0.12), 0 2px 4px rgba(236,72,153,0.08)',
        'pink-lg':  '0 10px 30px rgba(236,72,153,0.15), 0 4px 6px rgba(236,72,153,0.10)',
        'pink-glow':'0 0 20px rgba(236,72,153,0.25)',
        'blue-sm':  '0 1px 3px rgba(59,130,246,0.15), 0 1px 2px rgba(59,130,246,0.08)',
        'blue-md':  '0 4px 12px rgba(59,130,246,0.15), 0 2px 4px rgba(59,130,246,0.10)',
        'blue-lg':  '0 10px 30px rgba(59,130,246,0.18), 0 4px 6px rgba(59,130,246,0.12)',
        'blue-glow':'0 0 20px rgba(59,130,246,0.30)',
        'card':     '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)',
        'card-hover':'0 8px 24px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'slide-up':     'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-right':  'slideRight 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':     'scaleIn 0.2s ease-out',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite',
        'bounce-soft':  'bounceSoft 2s ease-in-out infinite',
        'theme-switch': 'themeSwitch 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        themeSwitch: {
          '0%':   { opacity: '0.5', transform: 'scale(0.95) rotate(-5deg)' },
          '100%': { opacity: '1',   transform: 'scale(1)   rotate(0deg)'   },
        },
      },
      transitionDuration: { 250: '250ms' },
      backgroundImage: {
        'pink-gradient':    'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
        'pink-soft':        'linear-gradient(135deg, #FFF0F7 0%, #FFDCEE 100%)',
        'blue-gradient':    'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
        'blue-soft':        'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        'hero-light':       'linear-gradient(135deg, #FFF0F7 0%, #FFF7FB 50%, #EEF2FF 100%)',
        'hero-dark':        'linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #172554 100%)',
      },
    },
  },
  plugins: [],
};