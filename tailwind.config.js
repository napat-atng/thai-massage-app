/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf8f0',
          100: '#faecd6',
          200: '#f4d5a8',
          300: '#ecb870',
          400: '#e39540',
          500: '#dc7a22',
          600: '#ce6118',
          700: '#ab4a16',
          800: '#893b19',
          900: '#6f3118',
        },
      },
      fontFamily: {
        sans: ['Sarabun', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
