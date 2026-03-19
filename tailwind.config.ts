import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0d0d0d',
          card: '#1a1a1a',
          raised: '#242424',
          hover: '#2a2a2a',
          border: '#2e2e2e',
          text: '#ffffff',
          secondary: '#888888',
          muted: '#4a4a4a',
          gold: '#ebbd34',
          'gold-l': '#f5cb4a',
          lime: '#a8e63d',
          'lime-l': '#c0f060',
          danger: '#e05555',
          green: '#7cc44e',
        },
      },
      fontFamily: {
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        ui: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
