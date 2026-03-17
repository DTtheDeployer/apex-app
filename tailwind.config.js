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
      boxShadow: {
        'apex-sm': '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)',
        'apex-md': '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'apex-lg': '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        'apex-glow': '0 0 20px rgba(0,168,150,0.15)',
      },
      borderRadius: {
        'apex': '12px',
      },
    },
  },
  plugins: [],
}
