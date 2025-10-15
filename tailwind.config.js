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
        brand: {
          50:'#f5f7ff',100:'#e9edff',200:'#dbe2ff',300:'#c3ccff',400:'#9aa9ff',
          500:'#6a7cff',600:'#4a5ce6',700:'#3a49b4',800:'#2f3a8a',900:'#262f6d'
        },
      },
      boxShadow: { glass: '0 10px 30px rgba(0,0,0,.25)' },
      backgroundImage: {
        'hero-a': 'radial-gradient(1200px 600px at 10% -10%, rgba(80, 120, 255, 0.15), transparent)',
        'hero-b': 'radial-gradient(900px 400px at 90% -10%, rgba(255, 40, 100, 0.12), transparent)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};