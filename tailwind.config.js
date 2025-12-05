/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1e1e1e',
          sidebar: '#2a2a2a',
          card: '#2f2f2f',
          hover: '#3e3e3e',
          border: '#3e3e42',
        },
      },
    },
  },
  plugins: [],
}
