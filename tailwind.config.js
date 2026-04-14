/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#8196fa',
          500: '#6171f6',
          600: '#4f51ea',
          700: '#4040cf',
          800: '#3435a7',
          900: '#2e3184',
        },
      },
    },
  },
  plugins: [],
};
