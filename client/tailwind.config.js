/** @type {import('tailwindcss').Config} */

// Flat design system: opaque surfaces, one evergreen accent, 1px hairlines,
// no shadows/gradients/blur, no decorative motion. DaisyUI animation vars are
// zeroed per theme so buttons/inputs change state instantly.
const flatVars = {
  '--rounded-box': '0.875rem',
  '--rounded-btn': '0.625rem',
  '--rounded-badge': '999px',
  '--animation-btn': '0s',
  '--animation-input': '0s',
  '--btn-focus-scale': '1',
  '--border-btn': '1px',
  '--tab-border': '1px',
  '--tab-radius': '0.5rem'
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['"Hanken Grotesk Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      // Steps used across the app that Tailwind's default scale doesn't ship —
      // without these, classes like `bg-primary/12` silently compile to nothing.
      opacity: {
        8: '0.08',
        12: '0.12'
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        // Dark — ink neutrals + evergreen accent.
        'ultragrade-classic': {
          primary: '#8eb79a',
          'primary-content': '#0f1f15',
          secondary: '#b5cdb7',
          'secondary-content': '#0f1f15',
          accent: '#8eb79a',
          'accent-content': '#0f1f15',
          neutral: '#1c241f',
          'neutral-content': '#e6ebe7',
          'base-100': '#101612',
          'base-200': '#161d19',
          'base-300': '#262f29',
          'base-content': '#e6ebe7',
          info: '#8db2cf',
          success: '#86bd95',
          warning: '#dcb177',
          error: '#e0928e',
          ...flatVars
        }
      },
      {
        // Light — pearl neutrals + evergreen accent.
        'ultragrade-light': {
          primary: '#28774f',
          'primary-content': '#ffffff',
          secondary: '#5d7866',
          'secondary-content': '#ffffff',
          accent: '#28774f',
          'accent-content': '#ffffff',
          neutral: '#e9ece7',
          'neutral-content': '#18211b',
          'base-100': '#f5f6f3',
          'base-200': '#ffffff',
          'base-300': '#dfe3dd',
          'base-content': '#18211b',
          info: '#2a72ad',
          success: '#1d8045',
          warning: '#a8661c',
          error: '#c23b30',
          ...flatVars
        }
      }
    ],
    defaultTheme: 'ultragrade-classic'
  }
}
