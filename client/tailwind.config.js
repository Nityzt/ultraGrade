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
        obsidian: '#0d1117',
        // Kinetic Moss (Classic) accents — electric lime + spring green on dark moss.
        lime: '#c3f400',
        'lime-soft': '#d9f99d',
        spring: '#4ae176',
        moss: '#0b1511'
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.40)',
        ambient: '0 10px 30px rgba(0, 0, 0, 0.06)',
        'ambient-lg': '0 20px 45px rgba(0, 0, 0, 0.10)',
        // bloom is a per-theme glow — the CSS var --bloom-color lets each theme
        // recolor the primary glow (sage / lime / emerald) without new utilities.
        bloom: '0 0 18px var(--bloom-color, rgba(181, 205, 183, 0.35))'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' }
        },
        // Same fade-up shape, but the easing overshoots past 100% before settling —
        // a light spring "pop" rather than a plain glide. Used for staggered entrances.
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        // Draggable theme toggle "try me" hints. Both rest at a no-op keyframe at
        // 0%/100% so `prefers-reduced-motion` (which zeroes duration) shows nothing.
        'toggle-halo': {   // sonar ping emanating outward
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '25%': { opacity: '0.5' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        'toggle-nudge': {  // occasional little "I'm draggable" wiggle
          '0%, 82%, 100%': { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '86%': { transform: 'translate3d(-2px,0,0) rotate(-11deg)' },
          '90%': { transform: 'translate3d(2px,0,0) rotate(8deg)' },
          '94%': { transform: 'translate3d(-1px,0,0) rotate(-4deg)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'toggle-halo': 'toggle-halo 2.8s ease-out infinite',
        'toggle-nudge': 'toggle-nudge 5s ease-in-out infinite'
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        // Ink + evergreen — quiet dark counterpart to the pearl light theme.
        'ultragrade-classic': {
          primary: '#8eb79a',
          'primary-focus': '#739d80',
          'primary-content': '#102218',
          secondary: '#b5cdb7',
          'secondary-content': '#102218',
          accent: '#8eb79a',
          'accent-content': '#102218',
          neutral: '#16221b',
          'base-100': '#101612',
          'base-200': '#151d18',
          'base-300': '#26322a',
          'base-content': '#e5ebe6',
          info: '#86aac7',
          success: '#83b991',
          warning: '#d6ab71',
          error: '#d98c88'
        }
      },
      {
        // Pearl + evergreen — the light counterpart.
        'ultragrade-light': {
          primary: '#28774f',
          'primary-focus': '#1e6240',
          'primary-content': '#ffffff',
          secondary: '#65806d',
          'secondary-content': '#ffffff',
          accent: '#28774f',
          'accent-content': '#ffffff',
          neutral: '#ffffff',
          'base-100': '#f5f6f3',
          'base-200': '#ffffff',
          'base-300': '#dfe4dd',
          'base-content': '#19221c',
          info: '#2f80c2',
          success: '#15a34a',
          warning: '#d0872f',
          error: '#d24236'
        }
      }
    ],
    defaultTheme: 'ultragrade-classic'
  }
}
