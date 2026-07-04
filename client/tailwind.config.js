/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Hanken Grotesk is the signature face — warm humanist grotesque, Apple-like.
        sans: ['Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        // Signature accents — usable directly (e.g. text-sage, bg-sand/15) alongside DaisyUI tokens.
        sage: '#b5cdb7',
        'sage-deep': '#0f9d58',
        sand: '#f7bb7e',
        ruby: '#ffb4ab',
        obsidian: '#0d1117'
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.40)',
        ambient: '0 10px 30px rgba(0, 0, 0, 0.06)',
        'ambient-lg': '0 20px 45px rgba(0, 0, 0, 0.10)',
        bloom: '0 0 18px rgba(181, 205, 183, 0.35)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        // Obsidian + sage — the default signature theme
        'ultragrade-dark': {
          primary: '#b5cdb7',
          'primary-focus': '#a0bda3',
          'primary-content': '#16281a',
          secondary: '#f7bb7e',
          'secondary-content': '#2c1600',
          accent: '#d1e9d2',
          'accent-content': '#16281a',
          neutral: '#1c2026',
          'base-100': '#0d1117',
          'base-200': '#161b22',
          'base-300': '#262a31',
          'base-content': '#dfe2eb',
          info: '#7fb4d6',
          success: '#7ee0a3',
          warning: '#f7bb7e',
          error: '#ffb4ab'
        }
      },
      {
        // Paper + emerald — the light counterpart, brand hue stays green
        'ultragrade-light': {
          primary: '#0f9d58',
          'primary-focus': '#0c7d46',
          'primary-content': '#ffffff',
          secondary: '#e0913f',
          'secondary-content': '#ffffff',
          accent: '#0f9d58',
          'accent-content': '#ffffff',
          neutral: '#ffffff',
          'base-100': '#eef2ef',
          'base-200': '#ffffff',
          'base-300': '#dbe4de',
          'base-content': '#16241c',
          info: '#2f80c2',
          success: '#15a34a',
          warning: '#d0872f',
          error: '#d24236'
        }
      }
    ],
    defaultTheme: 'ultragrade-dark'
  }
}
