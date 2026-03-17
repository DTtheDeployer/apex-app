/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0A1628',
        surface:  '#0f1f3a',
        surface2: '#162a4a',
        border:   'rgba(255,255,255,0.08)',
        green:    '#00d084',
        teal:     '#00A896',
        'teal-light': '#00D4AA',
        red:      '#ff4d6a',
        blue:     '#5b7fff',
        gold:     '#f5b642',
        muted:    '#9ba3b8',
        subtle:   '#6b7a99',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
