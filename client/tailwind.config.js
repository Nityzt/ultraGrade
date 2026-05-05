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
          primary: '#4ade80',
          'primary-focus': '#22c55e',
          secondary: '#86efac',
          accent: '#f0abfc',
          neutral: '#162213',
          'base-100': '#080d09',
          'base-200': '#0d1710',
          'base-300': '#162213',
          'base-content': '#dcfce7',
          info: '#67e8f9',
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#f87171'
        }
      },
      {
        'ultragrade-light': {
          primary: '#16a34a',
          'primary-focus': '#15803d',
          secondary: '#22c55e',
          accent: '#d946ef',
          neutral: '#f0fdf4',
          'base-100': '#ffffff',
          'base-200': '#f0fdf4',
          'base-300': '#dcfce7',
          'base-content': '#14532d',
          info: '#0ea5e9',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      }
    ],
    defaultTheme: 'ultragrade-dark'
  }
}
