/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#16A34A',
        'primary-hover': '#15803D',
        'bg-main': '#EEF6FF',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.07)',
        nav:  '0 1px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}