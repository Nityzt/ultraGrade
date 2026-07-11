import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft, ArrowRight, Check, Sparkles, Sun, Gauge, CalendarClock, FileUp } from 'lucide-react';
import { useThemeTransition } from '../../hooks/useThemeTransition.js';

// ── "Kinetic Moss, At Rest" ──────────────────────────────────────────────────
// A calm, one-hero pre-login intro. The brand is normally high-energy (electric
// lime on deep moss); here it's slowed to a single breathing orb so the first
// impression reads premium, not busy.
//
// Layout is genuinely responsive, not a stretched phone column:
// - Mobile: stacked and centered — orb, copy, full-width controls at the bottom.
// - md+: an editorial two-column composition — the orb anchors the left half,
//   the copy sits LEFT-ALIGNED on the right with its controls directly under
//   it, so the page reads like a designed spread instead of a centered strip.
// Fixed slot heights keep the orb and title from re-centering between panels.
//
// Motion budget stays tiny: ONE breathing orb, ONE fade-up per panel, CSS
// stagger on the feature cards. framer-motion honours the global MotionConfig
// reducedMotion="user".

const PANELS = [
  {
    key: 'welcome',
    eyebrow: 'Welcome to ultraGrade',
    title: ['Grades,', 'mastered.'],
    body: 'Your whole semester — GPA, deadlines, and timetable — in one calm, honest place.',
  },
  {
    key: 'what',
    eyebrow: 'Built to keep up',
    title: ['Everything', 'that counts.'],
    features: [
      { Icon: Gauge, label: 'Live GPA', hint: 'On every Ontario scale, updated as you go.' },
      { Icon: CalendarClock, label: 'Nothing sneaks up', hint: 'Deadlines and classes, always in view.' },
      { Icon: FileUp, label: 'Drop an outline', hint: 'Import a course PDF and get your whole term.' },
    ],
  },
  {
    key: 'theme',
    eyebrow: 'Make it yours',
    title: ['Pick your', 'look.'],
    body: 'Tap to try each one — the whole screen switches live. Change it anytime in Settings.',
  },
];

const THEME_CHOICES = [
  {
    value: 'ultragrade-classic',
    label: 'Classic',
    hint: 'Electric lime on deep moss',
    Icon: Sparkles,
    // Static swatch preview colours (Tailwind JIT can't see dynamic classes, and
    // these must render correctly even before the theme is applied).
    bg: '#0b1511',
    fg: '#c3f400',
    ring: 'rgba(195, 244, 0, 0.55)',
  },
  {
    value: 'ultragrade-light',
    label: 'Light',
    hint: 'Emerald on soft paper',
    Icon: Sun,
    bg: '#eef2ef',
    fg: '#0f9d58',
    ring: 'rgba(15, 157, 88, 0.45)',
  },
];

// The signature anchor: a soft brand-coloured orb that slowly inhales and
// exhales. `primary` themes it automatically (lime in Classic, emerald in
// Light), so switching themes on panel 3 recolours the hero too. Scaled up on
// wide screens via the wrapper so it can actually hold half the canvas.
function BreathingOrb() {
  return (
    <div
      className="relative flex items-center justify-center scale-90 md:scale-125 xl:scale-150 transition-transform duration-500"
      aria-hidden="true"
    >
      {/* Outer atmospheric bloom */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(from var(--p) l c h / 0.28) 0%, transparent 68%)',
          filter: 'blur(6px)',
        }}
        animate={{ scale: [1, 1.14, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      />
      {/* Thin orbit ring — one quiet accent, not decoration spam */}
      <motion.div
        className="absolute w-40 h-40 rounded-full border"
        style={{ borderColor: 'oklch(from var(--p) l c h / 0.22)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 0.4 }}
      />
      {/* Solid core with the mortarboard mark */}
      <motion.div
        className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-bloom"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      >
        <GraduationCap className="w-11 h-11 text-primary-content" />
      </motion.div>
    </div>
  );
}

export default function WelcomeIntro({ onDone }) {
  const { theme, setTheme } = useThemeTransition();
  const [index, setIndex] = useState(0);
  const panel = PANELS[index];
  const isLast = index === PANELS.length - 1;

  const go = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= PANELS.length) return;
    setIndex(nextIndex);
  };
  const next = () => (isLast ? onDone() : go(index + 1));
  const back = () => go(index - 1);

  // Keyboard: arrows step, Escape skips. (Enter/Space stay native so focused
  // buttons don't double-fire.)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
      else if (e.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const controls = (
    <>
      <button
        onClick={back}
        disabled={index === 0}
        aria-label="Previous"
        className="pressable w-11 h-11 shrink-0 rounded-full border border-base-300 flex items-center justify-center text-base-content/60 hover:text-base-content hover:bg-base-200/60 transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <ArrowLeft size={18} />
      </button>
      <button
        onClick={next}
        className="btn btn-primary flex-1 md:flex-none md:px-10 rounded-full font-bold gap-2 shadow-bloom active:scale-[0.98] transition-transform"
      >
        {isLast ? "Let's go" : 'Continue'}
        {isLast ? <Check size={18} /> : <ArrowRight size={18} />}
      </button>
    </>
  );

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-base-100 overflow-hidden select-none">
      {/* Ambient top bloom, matching the app's body atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 0%, oklch(from var(--p) l c h / 0.10) 0%, transparent 70%)' }}
      />
      {/* Fine grain overlay — the quiet texture that keeps the flat canvas from
          reading as generic. Pure CSS, no asset. */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Framed page: everything lives inside one measured container instead of
          hugging the viewport corners. */}
      <div className="relative z-10 flex-1 flex flex-col w-full max-w-6xl mx-auto px-6 md:px-10 pt-6 md:pt-8 pb-6 md:pb-10 pt-safe pb-safe min-h-0">
        {/* Top bar: progress + step count + Skip */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center" role="tablist" aria-label="Intro progress">
            {PANELS.map((p, i) => (
              <button
                key={p.key}
                onClick={() => go(i)}
                role="tab"
                aria-label={`Go to step ${i + 1}`}
                aria-selected={i === index}
                className="p-1.5 group"
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    i === index ? 'w-7 bg-primary' : 'w-2 bg-base-content/25 group-hover:bg-base-content/50'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-base-content/30 tabular" aria-hidden="true">
              {`0${index + 1} / 0${PANELS.length}`}
            </span>
            <button
              onClick={onDone}
              className="text-xs font-semibold text-base-content/40 hover:text-base-content px-2 py-1 rounded-full transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Hero + content. Drag anywhere horizontally to advance/return. */}
        <motion.div
          className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center md:gap-12 lg:gap-20"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70) next();
            else if (info.offset.x > 70) back();
          }}
        >
          {/* Orb slot: fixed height on mobile, half the spread on md+ — the
              anchor never moves between panels. */}
          <div className="h-52 md:h-auto md:flex-1 md:self-stretch shrink-0 flex items-center justify-center md:justify-end md:pr-6">
            <BreathingOrb />
          </div>

          {/* Content column: centered on mobile, left-aligned editorial on md+.
              Fixed min-height + controls pinned to the column's baseline so the
              primary button NEVER moves between panels (steppers get
              double-clicked; a wandering target misses). */}
          <div className="w-full max-w-md md:flex-1 md:max-w-lg text-center md:text-left flex flex-col justify-center md:justify-start md:min-h-[30rem]">
            {/* Keyed remount replays the CSS fade-up on each panel — no
                AnimatePresence (its exit→enter "wait" added ~0.85s of lag and
                this app has hit AnimatePresence freezes before). */}
            <div key={panel.key} className="animate-fade-up md:flex-1 md:flex md:flex-col md:justify-center">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70 mb-3">
                {panel.eyebrow}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.02] tracking-tight text-base-content">
                {panel.title[0]}
                <br />
                <span className="text-primary">{panel.title[1]}</span>
              </h1>

              {panel.body && (
                <p className="mt-5 text-[15px] lg:text-base leading-relaxed text-base-content/55 max-w-sm mx-auto md:mx-0">
                  {panel.body}
                </p>
              )}

              {panel.features && (
                // CSS stagger, NOT framer children: these cards live inside a
                // drag-wrapped parent, and animate-fade-up is self-contained —
                // nothing to strand at opacity 0.
                <div className="mt-7 flex flex-col gap-3 text-left">
                  {panel.features.map(({ Icon, label, hint }, i) => (
                    <div
                      key={label}
                      className="flex items-start gap-3.5 glass-card px-4 py-3 animate-fade-up"
                      style={{ animationDelay: `${120 + i * 90}ms` }}
                    >
                      <span className="mt-0.5 w-8 h-8 shrink-0 rounded-xl bg-primary/12 text-primary flex items-center justify-center">
                        <Icon size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-base-content">{label}</span>
                        <span className="block text-xs text-base-content/45 leading-snug">{hint}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {panel.key === 'theme' && (
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {THEME_CHOICES.map((choice) => {
                    const active = theme === choice.value;
                    return (
                      <button
                        key={choice.value}
                        onClick={(e) => setTheme(choice.value, e)}
                        aria-pressed={active}
                        className="group pressable relative rounded-2xl p-4 text-left transition-[outline,box-shadow] duration-200"
                        style={{
                          background: choice.bg,
                          outline: active ? `2px solid ${choice.fg}` : '1px solid oklch(from var(--bc) l c h / 0.14)',
                          outlineOffset: active ? '2px' : '0px',
                          boxShadow: active ? `0 0 22px ${choice.ring}` : 'none',
                        }}
                      >
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                          style={{ background: choice.fg }}
                        >
                          <choice.Icon size={17} color={choice.bg} />
                        </span>
                        <span className="block text-sm font-bold" style={{ color: choice.fg }}>
                          {choice.label}
                        </span>
                        <span className="block text-[11px] mt-0.5" style={{ color: choice.fg, opacity: 0.6 }}>
                          {choice.hint}
                        </span>
                        {active && (
                          <span
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: choice.fg }}
                          >
                            <Check size={12} color={choice.bg} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop controls: pinned to the column's baseline — same spot on
                every panel. */}
            <div className="hidden md:flex items-center gap-3 mt-10 shrink-0">
              {controls}
            </div>
          </div>
        </motion.div>

        {/* Mobile controls: thumb-reach bottom bar */}
        <div className="md:hidden flex items-center gap-4 w-full max-w-md mx-auto shrink-0 pt-4">
          {controls}
        </div>
      </div>
    </div>
  );
}
