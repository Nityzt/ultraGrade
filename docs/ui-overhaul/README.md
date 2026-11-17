# UI overhaul: flat, minimal, fast

This folder is the shared context for the overhaul issues (tracking: #12). If you're picking up an issue, read this page first. It should take about 5 minutes.

## Goal
ultraGrade should feel **minimal and flat**:
- solid colours only, with no gradients, fades, glows, blur or translucency
- the effort goes into UX: clear navigation, reachable controls, readable text
- **light and responsive** on iPhone (including as an installed PWA), iPad, laptop and desktop

## Workflow for issue PRs
1. Branch from `main`. Name the branch `ux/<issue-number>-<slug>`.
2. Open the PR **into `main`**, with `Closes #<issue>` in the body. Keep it to one issue per PR.
3. Stay inside the files your issue **owns** (each issue lists them). If you have to touch a file another issue owns, keep the edit small and mention it in the PR description.
4. Before you ask for review, run the [verification checklist](#verification-checklist-every-pr).
5. When an issue lists **dependencies**, merge those first. #12 has the merge order.

`main` deploys to production (Vercel and Render), so every PR must leave the app working.

## What's already done (foundation, merged to `main`)
- **Colour bug fixed in CSS.**
  - DaisyUI 4 colour tokens are **OKLCH triples**, so `hsl(var(--p))` is invalid CSS and was silently dropped. That's why pills, rails and focus rings had no colour.
  - `client/src/index.css` was rewritten as one flat layer using `oklch(var(--x) / a)`.
  - A few decorative inline `hsl(var(--…))` and `oklch(from …)` styles are still in JSX (glows and orbs in Header, Sidebar, BottomNav, Login, WelcomeIntro and dead dashboard widgets). They're invisible today. Delete them, don't fix their syntax.
- **Tokens.** `client/tailwind.config.js` has opaque base colours per theme, one evergreen `primary`, and zeroed DaisyUI animation variables. It also defines radii and adds the missing opacity steps `/8` and `/12`.
- **Font.** Hanken Grotesk is self-hosted (`@fontsource-variable/hanken-grotesk`, precached by the service worker). Google Fonts, Inter and JetBrains Mono are gone.
- **Theme switching is instant**: `client/src/hooks/useThemeTransition.js` no longer uses a View-Transition sweep. Labels are "Dark" and "Light". The theme updates `<meta name="theme-color">`, and the pre-paint script reads the `ultragrade_theme` key, so light-theme users no longer get a dark flash.
- **Classes renamed.** `glass-card` and `command-surface` became `.surface`, `glass-hover` became `.surface-hover`, and the elevated variant became `.surface-accent`.
- **Removed:** the cursor spotlight hook, the global colour cross-fade, and the route `page-enter` fade (its class is now a no-op).

## Design rules (please follow them)
| Do | Don't |
|---|---|
| Opaque surfaces: page `bg-base-100`, card `.surface` / `bg-base-200`, hairline `border-base-300` | `bg-base-100/70`, `backdrop-blur-*`, glass |
| One accent: `primary`, used for the primary action, the active nav item and focus | Multiple accent colours or decorative colour |
| Separate things with a 1px border and spacing | `shadow-*`, `drop-shadow`, glows, `text-shadow` |
| Colour through Tailwind utilities (`bg-primary/12`) or `oklch(var(--p) / .12)` | `hsl(var(--p))`, `oklch(from var(--p) …)`, hard-coded hex that ignores the theme |
| Opacity modifiers from the scale: 5, 8, 10, 12, 15, 20 … 95 | `/7`, `/92` and similar, which compile to nothing |
| State changes happen instantly | `animate-fade-*`, `pop-in`, `pulse`, `AnimatePresence`, framer-motion, enter/exit fades, `transition-colors` |
| `.pressable` (a 0.97 scale on `:active`) for tap feedback, `animate-spin` for loaders | Hover lifts, scale-on-hover, wiggles, sweeps |
| Touch targets of 44×44px or more (`.hit-44` expands small icons) | 20–32px tap targets |
| Mobile inputs of 16px or more | Smaller inputs, which make iOS zoom |
| `h-dvh`, `min-h-dvh`, `max-h-[90dvh]` | `h-screen` / `100vh`, which is wrong under iOS Safari's toolbars |
| `var(--nav-h)`: `.app-main` pads content clear of the phone bottom nav, `.above-nav` positions anything that floats above it | Magic numbers like `pb-28` or `bottom-24` |
| `env(safe-area-inset-*)` via `.pt-safe` / `.pb-safe` | Content under the notch or home indicator |
| Accessible names on icon buttons, `<label htmlFor>` on inputs | Placeholder-as-label |

**Shared primitives:**
- In `client/src/components/ui/CommandPrimitives.jsx`: `Surface`, `StatusPill`, `ActionRow`, `SectionHeader`, `Metric`, `TimelineItem`, `EmptyState`. Reuse them and don't build parallel ones.
- CSS classes in `index.css`: `.surface`, `.pill`, `.status-pill(-primary|-success|-warning)`, `.segment-control` (which styles `[aria-selected=true]` / `[aria-pressed=true]`), `.action-row`, `.timeline-*`, `.command-link-card`, `.nav-item-active`, `.prompt-chip`, `.hero-prompt`, `.semantic-label`, `.display-title`.

**Breakpoints:**
| Width | Layout |
|---|---|
| Phone, under 768px | Bottom nav, single column |
| Tablet, 768–1023px | Icon-only rail |
| `lg` and up (1024px+) | Full 240px rail |

Page content is capped at about 1200px (`.command-page`).

**Navigation (decided):** Home · Grades · Planner · Timetable · More. More holds Life Hub, Connections and Profile. Ask is a header button and ⌘K on desktop, and a floating button above the bottom nav on phones.

## Running it locally
```bash
npm run install:all
npm run build --prefix client
npx --prefix client vite preview --host 127.0.0.1 --port 4173
# open http://127.0.0.1:4173/demo   (seeded in-memory data, no backend or credentials needed)
```
- Bind local servers to `127.0.0.1` only.
- `/login` talks to a **real** Supabase project. Never script-click sign-in, sign-up or "Continue as guest" there.

## Verification checklist (every PR)
- [ ] `npm test` (repo root) passes, and logic fixes come with a new test.
- [ ] `npm run build` passes.
- [ ] In the files you touched, none of these remain: `hsl(var(--`, `backdrop-blur`, `shadow-`, `animate-` (except `animate-spin`), `framer-motion`, `h-screen`, `transition-colors`.
- [ ] Checked in `/demo` at **393×852** (iPhone, touch) and **1440×900**, in both themes. Nothing scrolls sideways, nothing hides under the bottom nav, and focus rings are visible when tabbing.
- [ ] In the PR description: before/after screenshots of what you changed.

## Audit reports
The full findings from the 2026-11-17 audit are in [`audit/`](audit/):
- [`mobile.md`](audit/mobile.md): emulated iPhone SE, 15 and Pro Max.
- [`desktop.md`](audit/desktop.md): 1280–1920px plus iPad, with keyboard and Lighthouse.
- [`perf.md`](audit/perf.md): bundle, PWA and code-correctness review.
- [`scripts/`](audit/scripts/): the in-page measurement scripts (overflow, tap targets, colours). Paste them into DevTools or `evaluate_script`.

Line numbers in the reports refer to commit `a41dad3`, before the foundation commit, so search by symbol name rather than line number. The screenshots they mention (`shots/…`) weren't committed (about 20MB). Re-run the scripts to reproduce.

**Baseline to beat:**
- 266.8 KB gzip initial load.
- About 770 KB gzip precached on install.
- Lighthouse Accessibility 85–94.
