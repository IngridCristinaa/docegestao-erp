/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bordo: {
          DEFAULT: '#701D2B',
          dark: '#53131E',
          light: '#8E2839',
        },
        chocolate: {
          DEFAULT: '#542C20',
          dark: '#3A1D14',
          light: '#734132',
        },
        creme: {
          DEFAULT: '#F5E8D8',
          light: '#FBF5EE',
          dark: '#E8D4BC',
        },
        champagne: {
          DEFAULT: '#C69A55',
          dark: '#A67D3D',
          light: '#DFBC82',
        },
        taupe: {
          DEFAULT: '#A99B91',
          light: '#CFC5BE',
          dark: '#7F7269',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};