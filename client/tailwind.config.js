/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Navy-Gold-Teal Palette
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172e',
          950: '#020617',
        },
        premium: {
          navy: '#0f172e',
          deepnavy: '#0a0f24',
          slate: '#1a1f35',
          teal: '#14b8a6',
          accent: '#c9a96e',
          gold: '#d4a373',
          light: '#f8fafc',
          muted: '#94a3b8',
        },
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 20px 50px rgba(15, 23, 46, 0.3), 0 4px 12px rgba(15, 23, 46, 0.2)',
        'premium-lg': '0 25px 60px rgba(15, 23, 46, 0.4), 0 8px 20px rgba(15, 23, 46, 0.25)',
        'premium-sm': '0 10px 25px rgba(15, 23, 46, 0.15), 0 2px 6px rgba(15, 23, 46, 0.1)',
        'glow-teal': '0 0 30px rgba(20, 184, 166, 0.25)',
        'glow-gold': '0 0 30px rgba(201, 169, 110, 0.2)',
      },
      backdropBlur: {
        'xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow': 'glow 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(20, 184, 166, 0.3)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      spacing: {
        'safe': 'max(1rem, env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
}
