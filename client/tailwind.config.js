/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        'ultragrade-dark': {
          primary: '#818cf8',
          'primary-focus': '#6366f1',
          secondary: '#34d399',
          accent: '#f472b6',
          neutral: '#1e293b',
          'base-100': '#0f172a',
          'base-200': '#1e293b',
          'base-300': '#334155',
          'base-content': '#e2e8f0',
          info: '#38bdf8',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171'
        }
      },
      {
        'ultragrade-light': {
          primary: '#6366f1',
          'primary-focus': '#4f46e5',
          secondary: '#10b981',
          accent: '#ec4899',
          neutral: '#f1f5f9',
          'base-100': '#ffffff',
          'base-200': '#f8fafc',
          'base-300': '#e2e8f0',
          'base-content': '#1e293b',
          info: '#0ea5e9',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      }
    ],
    defaultTheme: 'ultragrade-dark'
  }
}
