# Session changelog

## 2026-07-21 — Demo foundation

- Added an isolated `/demo` data provider with a seeded Ontario international-student persona, courses, professors, tasks, timetable, permit date, calendar state, and a reset capability.
- The demo store is in browser memory only and does not initialize Supabase synchronization.
- Verification pending: route and UI integration build/test in the next batch.

## 2026-07-21 — Demo routes and content

- Added `/demo` routes for the command center, assistant, Life Hub, Connections, Profile, and seeded academic detail screens.
- Added a compact demo navigation shell for desktop and mobile, a visible demo badge, and reset controls.
- Added deterministic assistant preview responses for work rights, professor discovery, outline import, deadlines, completion, and rescheduling.
- Known limitation: the normal authenticated dashboard is intentionally unchanged in this batch; the command-center narrative is the dedicated demo surface.

## 2026-07-21 — Visual system

- Added reusable command-center primitives: Surface, StatusPill, ActionRow, SectionHeader, Metric, TimelineItem, and EmptyState.
- Added theme-parity command-center tokens, compact desktop rail, sticky phone navigation, touch-sized actions, and reduced-motion-compatible CSS transitions.

## 2026-07-21 — Fixture verification coverage

- Added a focused test proving each seeded demo fixture is isolated and returns the expected international-student/calendar state after a reset.

## 2026-07-21 — Final verification

- Verified client build and tests: 3 files / 78 assertions passed.
- Verified server tests and syntax checks: 2 tests passed; `index.js`, quick-add, and outline routes parse successfully.
- Dependency audits completed. Both client and server report one low-severity transitive advisory with an available `npm audit fix`; no dependency upgrades were made in this redesign.
- Known limitation: visual browser/device checks were not automated in this workspace. The layout includes responsive breakpoints and the existing accessible modal focus-restoration path is reused by the demo assistant.

## 2026-07-21 — Demo bootstrap hardening

- Bypassed authentication session initialization on `/demo` and made Supabase module initialization safe when preview credentials are absent. The demo still performs no Supabase sync or writes.
- Re-ran client verification after the bootstrap change: build succeeds and all 78 client assertions pass.

## 2026-07-21 — Demo detail-flow hardening

- Implemented category and grade mutations in the demo provider so `/demo/grades` remains interactive instead of exposing no-op controls.

## 2026-07-21 — Dependency and build hardening

- Applied non-breaking production audit fixes for server `body-parser`, client `dompurify`, and transitive brace expansion.
- Upgraded Vite, Vitest, Vite PWA, and the React Vite plugin to current compatible major versions to address remaining development-tool advisories.
- Updated the Vite chunk configuration for Rolldown’s function-based `manualChunks` API after the upgrade surfaced a build failure.

## 2026-07-21 — Verification after toolchain upgrade

- Full root test pipeline passes: 78 client assertions and 2 server tests.
- Vite 8 production build passes with PWA generation and stable vendor chunks.
- Production and development dependency audits now report zero vulnerabilities across root, server, and client.
- Dev-server smoke check served `/demo` successfully at the Vite fallback route. Automated browser screenshots/device interaction remain deferred because no browser runner is installed in this workspace.

## 2026-07-21 — Production command-center redesign

- Replaced the authenticated dashboard with a real-data command center: contextual actions, daily timeline, academic pulse, student support guidance, and task-oriented empty states.
- Replaced primary navigation with Home, Ask ultraGrade, Life Hub, Connections, and Profile; Grades, Planner, and Timetable remain reachable as secondary detail views. Legacy immigration and resources URLs now redirect into the relevant Life Hub tab.
- Added production Ask and Profile routes, made Life Hub use signed-in course/profile data, and made Connections use the real calendar/ICS controls outside demo mode.
- Reworked the shared visual treatment to ink/pearl surfaces with muted evergreen emphasis, compact spacing, improved mobile shell, and removed the neon/glow-heavy legacy look.
- Added command-center action derivation coverage; client tests now contain 80 assertions.

## 2026-07-21 — Final redesign verification

- Verified the seeded desktop and phone command center in headless Chrome at 1440px and 390px widths; the responsive rail/bottom navigation, dense layout, and no-neon surface treatment rendered as intended.
- Full root verification passes: 80 client assertions, 2 server tests, production build/PWA generation, dependency audit, and whitespace check.

## 2026-07-21 — Responsive scroll hardening

- Removed the later command-page padding override that was reintroducing excessive desktop bottom whitespace and an unnecessary scrollbar.
- Removed Planner’s nested inner vertical scroller so each detail view has one predictable page scroll surface.
- Tightened phone command-center supporting content without hiding actions: secondary action details and supporting guidance collapse at narrow widths, while their destinations remain available in the bottom navigation.
- Added a stable class hook for action-row detail text so responsive compaction is explicit rather than dependent on element position.
- Verified all key demo routes at 390px and 1440px in headless Chrome: no horizontal overflow was detected. Remaining vertical scrolling occurs only where page content exceeds the viewport (not from canvas padding or a nested scrollbar).
- Final verification: 80 client tests and 2 server tests pass; production build/PWA generation succeeds; root and server dependency audits report zero vulnerabilities. Root `concurrently` was updated to 9.2.4 by the audit fix to remediate the `shell-quote` advisory.

## 2026-07-21 — Demo desktop polish

- Suppressed visible native scrollbar chrome globally while preserving wheel, keyboard, touch, and assistive-technology scrolling. This prevents the transient scrollbar gutter that caused route-load jitter in the desktop demo.
- Reduced desktop command-center padding, section gaps, hero spacing, and timeline density so the primary demo view fits a standard desktop browser viewport more comfortably.

## 2026-07-21 — Value-first demo home and tour

- Rebuilt the demo Home around a single high-emphasis command stage: a sharper value proposition, prominent natural-language command box, and task-specific example prompts.
- Removed secondary academic pulse and long-form student-advantage content from the Home canvas. The remaining content is a concise Today/Next Moves pair, with detail views still reachable from the footer and navigation.
- Added a demo-only, three-step introduction tour that opens on every Home reload, can be skipped, replayed from the Home header, and opens Ask ultraGrade when completed.
- Browser verification at 1920×960 confirms the tour opens on fresh load, dismisses correctly, and the completed Home has no document overflow.

## 2026-07-21 — Guided product walkthrough

- Replaced the static modal introduction with a persistent, route-aware demo walkthrough that takes the viewer through the actual Home, Life Hub, and Ask ultraGrade screens.
- The walkthrough resets on every demo reload, may be restarted from Home, and ends on the live assistant screen where the viewer can run a seeded flow.
- Reframed the Home hero as an introduction to ultraGrade rather than an immediate prompt demand; it now offers a guided tour or a direct path to explore Ask ultraGrade.
- Browser-tested the complete walkthrough at 1440×960: each call to action navigates to its intended route, the guide updates per stop, and the final assistant screen has no document overflow.

## 2026-07-21 — Demo-only onboarding handoff

- Added a compact, visually matched onboarding introduction that appears on every fresh `/demo` load and introduces Maya’s seeded scenario, value proposition, and demo safety boundaries.
- The onboarding is intentionally scoped to `/demo`; it does not alter production account onboarding or persist completion.
- Completing onboarding immediately starts the real route-aware walkthrough. Browser verification confirms the expected handoff: onboarding first, then the Home walkthrough card.

## 2026-07-21 — Demo onboarding correction

- Replaced the compact demo-specific onboarding card with the original six-step onboarding wizard, as requested.
- Added a demo presentation mode to the existing wizard: `/demo` pre-fills Maya’s fixture, does not mutate demo data, and hands off to the guided walkthrough on completion. Production onboarding behavior remains unchanged.
- Verification: all 80 client tests, both server tests, and the production build pass.

## 2026-07-21 — Demo onboarding presentation fix

- Made the restored original onboarding wizard an opaque, full-screen `/demo` first scene so Home content cannot leak through behind the wizard.
- Preserved the original onboarding visual system while giving the demo shell a theme-aware solid canvas and restrained atmosphere.
- Verification: all client/server tests and the production build pass.

## 2026-07-21 — Interactive demo onboarding

- Enabled the restored onboarding wizard to mutate the isolated `/demo` fixture as it does in the production flow: name, school/GPA scale, student type, and optional semester selections now apply to the demo session.
- The demo remains fully isolated from Supabase and normal user data. Client/server tests and production build pass.

## 2026-07-21 — Smooth demo landing

- Removed the fresh-load onboarding jitter by rendering the `/demo` onboarding scene before mounting the demo shell or Home route, eliminating the underlying dashboard flash.
- Made the demo provider eager rather than suspense-loaded for the demo entry path and added a restrained 260ms composited onboarding entrance with a reduced-motion fallback.
- Verification: all client/server tests and the production build pass.

## 2026-07-21 — Demo onboarding motion

- Replaced the barely perceptible CSS entrance with a deliberate, calm Framer Motion scene reveal for the `/demo` onboarding.
- Added masked, staggered letter reveals for the original welcome title; supporting copy and CTA settle in after it, with a soft ambient halo behind the existing mark.
- Added reduced-motion fallbacks for all new onboarding motion. Client/server tests and production build pass.

## 2026-07-21 — Demo onboarding motion simplification

- Removed the letter-split reveal, ambient halo, and staggered element motion after visual review; they competed with the original wizard rather than strengthening it.
- Kept one cohesive motion decision: a short, calm whole-scene entrance alongside the wizard’s existing icon spring. Client/server tests and production build pass.

## 2026-07-21 — Demo landing motion correction

- Removed the whole-scene entrance after it reintroduced visible landing jitter and lacked a meaningful interaction trigger.
- The `/demo` onboarding now paints immediately; the original wizard’s contained icon spring is the only first-load motion. Client/server tests and production build pass.

## 2026-07-21 — Wizard motion refinement

- Replaced the wizard’s elastic icon/checkmark springs with a single 320ms fade-and-settle transition, removing the forced bounce while preserving a clear focus cue.
- Client/server tests and production build pass.

## 2026-07-21 — Wizard transition refinement

- Removed the onboarding wizard’s remaining horizontal carousel slide. Steps now crossfade in place over 160ms, avoiding directionality that did not fit the calm setup flow.
- Client/server tests and production build pass.

## 2026-07-21 — Demo route runtime regression fix

- Fixed a blank `/demo` route caused by a stale `custom={dir}` reference left after removing the wizard’s directional transition state.
- Verified in headless Chrome that the onboarding wizard renders on a fresh `/demo` load; all 80 client tests, both server tests, and the production build pass.

## 2026-07-21 — Demo onboarding redesign correction

- Reframed `/demo` onboarding around the original wizard’s proven visual language and interaction model rather than treating the production setup as a full demo script.
- The demo now has three focused steps: contextual welcome, interactive student-perspective selection (mutates the isolated demo session), and a tailored handoff to the real walkthrough.
- Verification: all 80 client tests, both server tests, and production build pass.
