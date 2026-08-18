/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#faf7f2',
          100: '#f5efe6',
          200: '#e8dfd3',
          300: '#d4c4b0',
          400: '#bba88f',
          500: '#a38d6d',
          600: '#8b7359',
          700: '#6f5c47',
          800: '#5a4a3a',
          900: '#4a3e33',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        }
      }
    },
  },
  plugins: [],
}
