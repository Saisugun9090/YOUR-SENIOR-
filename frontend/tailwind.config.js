/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050c1a',
          900: '#070d1a',
          800: '#0a1220',
          700: '#0d1629',
          600: '#111d38',
          500: '#1a2744',
          400: '#1e3a5f',
          300: '#2a4f7a',
        },
        gold: {
          700: '#a07830',
          600: '#b8922a',
          500: '#c9a84c',
          400: '#d4b860',
          300: '#e8d080',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeInUp 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
