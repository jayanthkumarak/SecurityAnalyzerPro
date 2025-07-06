/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {
      colors: {
        'lcars-bg': 'var(--bg-color)',
        'lcars-text': 'var(--text-color)',
        'lcars-cyan': 'var(--accent-cyan)',
        'lcars-pink': 'var(--accent-pink)',
        'lcars-purple': 'var(--accent-purple)',
        'lcars-yellow': 'var(--accent-yellow)'
      },
      borderRadius: {
        'lg': '32px',
        'sm': '12px'
      },
      fontFamily: {
        'lcars': ['Exo 2', 'sans-serif'],
        'sans': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}

