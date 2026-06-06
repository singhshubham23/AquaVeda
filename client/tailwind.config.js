/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aquaveda: {
          light: '#E0F2F1',
          DEFAULT: '#00897B',
          dark: '#004D40'
        }
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-up': 'fade-up 0.2s ease-out',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
