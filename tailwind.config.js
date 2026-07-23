/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tw-up': '#f87171',
        'tw-down': '#34d399',
      }
    },
  },
  plugins: [],
}
