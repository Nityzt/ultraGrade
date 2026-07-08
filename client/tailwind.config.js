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
        // Kinetic Moss — the flagship "Classic" brand identity. Electric lime on
        // deep moss; energetic, alive. This is the default for new users.
        'ultragrade-classic': {
          primary: '#c3f400',
          'primary-focus': '#abd600',
          'primary-content': '#161e00',
          secondary: '#4ae176',
          'secondary-content': '#002109',
          accent: '#d9f99d',
          'accent-content': '#161e00',
          neutral: '#18221c',
          'base-100': '#0b1511',
          'base-200': '#141e19',
          'base-300': '#222c27',
          'base-content': '#dae5dd',
          info: '#7fb4d6',
          success: '#4ae176',
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
    defaultTheme: 'ultragrade-classic'
  }
}
