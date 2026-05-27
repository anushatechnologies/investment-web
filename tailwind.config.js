/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#020817',
        navy: '#08152f',
        'navy-soft': '#102347',
        royal: '#2563eb',
        gold: '#f7b500',
        'gold-soft': '#f8cc5b',
      },
      fontFamily: {
        body: ['Manrope', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 25px 60px rgba(15, 23, 42, 0.45)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
