/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lido: {
          bg: '#0B1120',
          surface: '#151D2E',
          border: '#2A3A52',
          hover: '#1A2540',
          accent: '#00A3FF',
          success: '#53BA95',
          error: '#E14D4D',
          warning: '#F59E0B',
          text: '#E2E8F0',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};