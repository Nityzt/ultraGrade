# ultraGrade desktop / tablet QA report

Build: production preview at http://127.0.0.1:4173 (served from the service worker after first load). Tested 2026-11-17.
Viewports: 1280x800, 1440x900 (DPR 1 and 2), 1920x1080 (no touch); 820x1180 and 1180x820 (DPR 2, mobile+touch).
Data: `/demo` (in-memory). `/login` was only observed and audited. Nothing there was clicked or submitted.
Screenshots: `shots/desktop-*.png` (abbreviated to `shots/` below).
Source paths are relative to `client/`.

Counts: **P0: 1 · P1: 10 · P2: 22**

---

## P0 broken

- **[P0 broken] · /demo/timetable · 1280, 1440, 1920, 820 (iPad portrait), 1180 (iPad landscape) · Repro:** Timetable → "+ Class" → Day = Sat (or Sun) → Add Class. **Expected:** the class shows in the grid, or the grid offers weekend columns. **Actual:** the modal closes, no toast appears, and the class is nowhere on screen. The weekly grid shows Mon–Fri only, so a weekend class cannot be seen, edited or deleted at any width ≥768px. That includes both iPad orientations, where the Mon–Sun DayView is `md:hidden`. The class does exist: at 700px width the Sat tab lists "QA Saturday lab 9:00–10:30". **Evidence:** `shots/desktop-13-timetable-saturday-missing-evening-clipped.png`. DOM after save: only the 4 Mon–Fri blocks render. **Suspected source:** `src/components/timetable/WeeklyGrid.jsx:5-6` (`DAYS`/`DAY_NUMS` hard-coded to Mon–Fri) and `:121` (`if (dayIdx === -1) return null;`). `src/pages/Timetable.jsx:51,61` (DayView is mobile-only). The Day select in `AddClassModal.jsx` offers Sun–Sat.

## P1 painful

- **[P1 painful] · /demo/timetable · all ≥768 · Repro:** add a class Wed 19:00–22:00. **Expected:** the block spans 7–10pm, or the grid extends. **Actual:** the block is clipped at the 9pm grid edge: 108px tall = 2h instead of 3h, bottom 837 vs grid bottom 839. Its label still says "7:00 PM to 10:00 PM". Classes before 8:00 would hit the same clamp, because `timeToSlot` goes negative. **Evidence:** `shots/desktop-13-timetable-saturday-missing-evening-clipped.png`, `shots/desktop-22-timetable-light-1440.png`. **Suspected source:** `WeeklyGrid.jsx:7-8` (`START_HOUR=8`, `END_HOUR=21`) and `:12-15`.

- **[P1 painful] · all /demo routes · ≥768 · Repro:** press Ctrl+K (or ⌘K) anywhere in the demo. **Expected:** the Ask palette opens. **Actual:** nothing happens. In demo mode `CommandPalette` returns `<DemoAssistant/>`, which only listens for `ug:assistant` and has no keydown handler. The Ask FAB is also `display:none` at ≥768px. On desktop and iPad the assistant is therefore reachable only through the sidebar link. **Evidence:** after Ctrl+K no `[role=dialog]` appears; `.demo-ask-fab` computes `display:none`. **Suspected source:** `src/components/quickadd/CommandPalette.jsx:26` (`if (demo) return <DemoAssistant />`), `src/components/demo/DemoAssistant.jsx:35`, `src/index.css:246`.

- **[P1 painful] · all /demo routes · ≥768 · Repro:** look for a theme toggle. **Expected:** a toggle in the sidebar, as the non-demo sidebar has. **Actual:** there is no visible theme control at ≥768px. The demo sidebar has no toggle. `Header`'s toggle is `md:hidden`. `/demo/settings` maps to DemoProfile, which has none. The palette (which has "toggle theme") is replaced in demo mode. The only way I could switch was to shrink below 768px. (At <768px the Header toggle does work by keyboard: Enter switches to light.) **Evidence:** `document.querySelectorAll('[data-theme-toggle]')` = 0 visible at 1440. **Suspected source:** `src/components/layout/Sidebar.jsx:107-119` (demo branch omits the toggle block at `:156-171`), `src/components/layout/Header.jsx:72-79`.

- **[P1 painful] · all app routes · 1440 · Repro:** load /demo → Tab once. **Expected:** a readable "Skip to content" pill. **Actual:** the skip link slides in with a **transparent background**: `background: hsl(var(--p))` is invalid with DaisyUI 4 oklch tokens. The text is drawn straight over the logo and unreadable. The skip link itself works: Enter → `#main`, and the next Tab lands on "Tour". **Evidence:** `shots/desktop-24-skip-link-focus.png`. **Suspected source:** `src/index.css:507-520` (`.skip-link`). Same root cause as the mobile hsl finding.

- **[P1 painful] · /demo/timetable · 1440 · Repro:** Tab into the weekly grid. **Expected:** reach the existing classes quickly; slot buttons have meaningful names. **Actual:** 130 empty-slot buttons, all `tabIndex 0`, come before the class blocks in the tab order. Their accessible names use the day number: "Add class on **1** at 08:00". The class block names omit the day ("CSC309 lecture, 10:00 AM to 12:00 PM"). **Evidence:** a11y snapshot shows uid 54_34…54_163 slot buttons, then the class blocks. **Suspected source:** `WeeklyGrid.jsx:99-112` (slot buttons, label uses `day` number); entries are rendered after the slots.

- **[P1 painful] · /demo/grades · all · Repro:** look at the CSC309 card. **Expected:** "Projected" means an estimated final grade. **Actual:** "Running 92% (20% assessed) · **Projected 18.4%**". After adding an 85% project grade it reads "Projected 48.1%". The value is the worst-case floor (0 on everything unassessed), so a 92% student is told they are projected at 18%. **Evidence:** `shots/desktop-04-grades-dark-1440.png`, `shots/desktop-06-grades-add-grade.png`. **Suspected source:** `src/utils/gradeCalculations.js:54-59` ("assume 0 on unassessed … worst case"), label at `src/components/grades/CourseCard.jsx:201-206`.

- **[P1 painful] · PWA offline · 1440 · Repro:** load /demo online (SW active) → emulate Offline → navigate to /demo. **Expected:** the app renders in Hanken Grotesk. **Actual:** the app shell loads offline, which is good. Every Hanken Grotesk / Inter / JetBrains Mono face ends in status `unloaded` or `error`, `document.fonts.check('700 16px "Hanken Grotesk"')` = false, and text falls back to the system sans. Cache Storage holds only `workbox-precache-v2` (57 entries, includes index.html). There is **no `google-fonts-cache`**, and no gstatic or woff entries were found. Workbox only routes `fonts.googleapis.com` (the CSS) and never `fonts.gstatic.com` (the font files). Even the CSS rule produced no cache. **Evidence:** `shots/desktop-32-offline-fallback-font.png` vs `shots/desktop-01-walkthrough-step1.png`. **Suspected source:** `vite.config.js:48-56` (needs a gstatic CacheFirst route with `cacheableResponse: {statuses:[0,200]}`, or self-host the fonts and precache them via `globPatterns` woff2), `index.html:55`.

- **[P1 painful] · all routes · 820x1180 (iPad portrait) · Repro:** open Timetable or Grades in portrait. **Expected:** the content gets most of the width. **Actual:** the 768px switch puts the full 240px sidebar on screen, which is 29% of the width, leaving 580px of content. Weekly-grid columns are about 100px, so every class block truncates: "CSC309 lect…", "10:00 AM – 12:…". The walkthrough card (370x233) then covers the bottom-right of the content, and on Timetable it says "Stop 1 · Home". The bottom-nav→sidebar switch at 768 suits landscape (1180, 940px content) but is too early for portrait. Consider an icon rail between md and lg, or switching at lg (1024). **Evidence:** `shots/desktop-30-timetable-ipad-portrait.jpeg` (DevTools tiled this capture, but the content is legible); measured class block width 100px, `scrollWidth 97 = clientWidth`. **Suspected source:** `Sidebar.jsx:107` (`hidden md:flex … w-60`), `BottomNav.jsx` (`md:hidden`), `WeeklyGrid.jsx:57`.

- **[P1 painful] · /demo (sidebar) · 1440 / 1920 · Repro:** try to find Grades, Planner or Timetable. **Expected:** core academic tools sit with the primary nav. **Actual:** they are under "Academic details" pinned to the bottom of the rail: y=728–848 at 900px height and y=928–1048 at 1080. A 360–540px void separates them from the five primary items, and the "Reset demo" action sits in the same group. On Home they appear again as tiny footer links ("Need the detail view? Grades · Planner"). There are three entry points, and the most-used tools are the least prominent. **Evidence:** `shots/desktop-03-home-dark-1440.png`, `shots/desktop-28-home-1920.png`. **Suspected source:** `Sidebar.jsx:109-117`.

- **[P1 painful] · all app routes · 1440 (keyboard) · Confirms mobile finding on desktop:** Tab order is logical (skip link → 9 sidebar items → page content → walkthrough → wrap). But **22 of 24 non-skip stops have `outline-style: none` and `box-shadow: none`** on `:focus-visible`, so there is no visible ring. The only exceptions are `.btn-primary` ("Take the guided tour", "See life context"), which get `outline: 2px solid oklch(0.2326 …)`: the dark primary-content colour on a dark background, effectively invisible. Modal close buttons and ranges have the same problem (What-do-I-need: Close `outline none`). **Evidence:** focus log in the "Keyboard pass" section, `shots/desktop-25-sidebar-focus-invisible.png`. **Suspected source:** `src/index.css:494-504` (`outline: 2px solid hsl(var(--p))`, invalid).

## P2 polish

- **[P2 polish] · all · all · Tailwind opacity steps that don't exist in the default scale compile to nothing.** `bg-primary/12` (14 uses) has 0 matches in `dist/assets/index-UiQgz081.css`. **Effect 1:** the active sidebar item has `background: rgba(0,0,0,0)`; only its text colour changes. **Effect 2:** `border-base-content/8` computes to Tailwind's default `rgb(229,231,235)`, so the sidebar "Academic details" divider and the Profile card divider are bright white hairlines in the dark theme. Also missing: `bg-{warning,info,error,success}/12`, `bg-base-100/92` (sticky header) and `bg-base-content/8` (progress tracks). **Evidence:** computed `borderTopColor: rgb(229, 231, 235)`; `shots/desktop-18-profile-dark-1440.png`. **Suspected source:** `Sidebar.jsx:16,86,117,148,167`, `DemoProfile.jsx:5`, `Header.jsx:53,60`, `CommandPalette.jsx:126,185` (the palette's selected-item highlight is invisible too). Fix: add `opacity: {8:'.08',12:'.12',92:'.92'}` to `tailwind.config.js` or use `/10`.
- **[P2 polish] · /demo/grades, /demo · 1440 · hsl family (desktop symptom):** on hover, `.glass-card` borders become `currentColor` (full white in dark, black in light) instead of a faint primary tint, a harsh flash as the mouse crosses cards. The "Demo mode" pill and the Home hero signal bars are transparent. **Evidence:** `shots/desktop-05-grades-add-category.png` (white CSC309 border), `shots/desktop-19-grades-light-1440.png` (black ECO101 border). **Suspected source:** `src/index.css:161,412` (`hsl(var(--p)/…)`), `:229`, `:482`.
- **[P2 polish] · 1440 / 1920 · inconsistent content width and alignment between sections.** At 1920: Home is centred at 1220px, Life Hub centred at 1280, Connections centred at 896, Ask and Profile centred at 768, while Grades, Planner and Timetable are full-bleed at 1680 and left-aligned. The page "jumps" between alignments when switching sections. At 1920 the Planner search field is 1320px wide and task rows are about 1320px with content in the left 30%. At 1440 the Home hero's right ~55% is empty. **Evidence:** `shots/desktop-26-planner-1920-stretched.png`, `shots/desktop-28-home-1920.png`, `shots/desktop-27-grades-1920.png`; layout JSON `pageBox` per route. **Suspected source:** `pages/Planner.jsx`, `Grades.jsx`, `Timetable.jsx` (no `max-w`), `pages/Ask.jsx:16`, `DemoProfile.jsx:5`, `Connections.jsx:11` (`max-w-3xl/4xl`), `index.css` `.command-page`.
- **[P2 polish] · inconsistent page headers:** Home, Life Hub, Ask, Connections and Profile use the giant `display-title` (about 72px) with an eyebrow. Grades, Planner and Timetable use the compact sticky `Header` (24px "Grades."). Two visual systems sit side by side. **Evidence:** compare `shots/desktop-15-lifehub-dark-1440.png` with `shots/desktop-08-planner-dark-1440.png`. **Suspected source:** `components/layout/Header.jsx` vs `.display-title`.
- **[P2 polish] · /demo/planner · 1440 · Repro:** Tab to a task's complete button → Space. Completion works by keyboard, but **focus drops to `<body>`** once the row re-renders and moves sections. The same thing happens after the theme toggle (the button is disabled during the sweep) and after each onboarding step (Explore → step 2: focus on BODY). **Evidence:** `document.activeElement` = BODY after each action. **Suspected source:** `components/planner/TaskItem.jsx:38-40` (keyed re-render), `index.css:563-569` (`[data-theme-toggle]:disabled`), `components/onboarding/OnboardingWizard.jsx`.
- **[P2 polish] · /demo · 1440 · Demo walkthrough card:** Esc does not close it; focus is not moved into it; it is the last tab stop. It covers the right side of "Your next best moves" at 1440 (`shots/desktop-03-home-dark-1440.png`). It shows "Stop 1 · Home" while on Timetable (iPad). Lighthouse: `aria-label` on a role-less div (`.demo-walkthrough-progress`). **Suspected source:** `components/demo/DemoWalkthrough.jsx:7,31`.
- **[P2 polish] · /demo/grades · 1440 · inline add category:** the weight field has `valuemax=0`, but entering 5 when weights already total 100 is accepted and only shows "Weights total 105%". **Expected:** inline validation or a clamp. **Evidence:** `shots/desktop-05-grades-add-category.png`. **Suspected source:** `CourseCard.jsx:~55-70`.
- **[P2 polish] · /demo/grades · 1440:** "+ Category" focuses the name input, but "+ Grade" leaves focus on the button (inconsistent). The inline Score and Weight inputs are so narrow that their placeholders read "Scor" and "Weigl", with the number spinner overlapping. **Evidence:** `shots/desktop-06-grades-add-grade.png`. **Suspected source:** `CategoryRow.jsx:55-70`, `CourseCard.jsx:62`.
- **[P2 polish] · /demo/grades · a11y:** category edit/delete and grade edit/delete icon buttons have no accessible name (snapshot shows bare `button`). Console reports 16 "No label associated with a form field" and 7 "form field should have an id or name" issues across the journey. The Add Task "Title" is named only by its placeholder ("Assignment 2 — UML Diagrams"); "Remind me" has no name. **Suspected source:** `CategoryRow.jsx:153-155`, `GradeEntryRow.jsx`, `components/planner/AddTaskModal.jsx`.
- **[P2 polish] · /demo · confirming mobile finding:** category delete calls `deleteCategory` directly with no confirm or undo (`CourseCard.jsx:228`, `CategoryRow.jsx:155`). Pencil and trash are visually separate at 1440 (24px each), but both use `hit-44` (44px `::before`) about 32px apart, so their hit areas overlap. Not clicked on desktop: same code path.
- **[P2 polish] · /demo/planner · 1440:** the status chips (Active/Completed/All) and type chips have no `aria-pressed`. There are two buttons named "All". The selected "Active" chip is `bg-neutral oklch(0.238)` on a ~0.2 surface, nearly indistinguishable from unselected. Calendar day buttons are announced as just "17" (no month or task count). **Evidence:** computed styles; `shots/desktop-08-planner-dark-1440.png`. **Suspected source:** `components/planner/TaskFilterBar.jsx:22`, `DeadlineCalendar.jsx`.
- **[P2 polish] · /demo/life · 1440:** `role="tab"` buttons have no arrow-key support, no `aria-controls`, no `tabpanel`, and every tab has `tabIndex 0`. Confirms the mobile "selected tab indistinguishable" on desktop (`shots/desktop-15-lifehub-dark-1440.png`). On Professors, "Your instructors" (CSC309/ECO101/PSY100) is static text: you can't switch the featured professor. **Suspected source:** `pages/LifeHub.jsx:16,37`.
- **[P2 polish] · /demo (onboarding):** any full page load (refresh, deep link, or a mobile↔desktop emulation change) wipes demo edits and re-shows the 3-step intro, even on `/demo/timetable`. The intro footer says "You can change any of this later in Settings." The demo has no Settings (`/demo/settings` → DemoProfile). The 1/3 progress bar fill is invisible. **Evidence:** `shots/desktop-01-walkthrough-step1.png`, `shots/desktop-29-ipad-portrait-onboarding-reappears.png`. **Suspected source:** `components/onboarding/OnboardingWizard.jsx:296`, `components/demo/DemoWalkthrough.jsx`.
- **[P2 polish] · /demo/connections:** the demo shows "Online · Changes sync through your existing account connection" although nothing syncs in demo. **Evidence:** `shots/desktop-17-connections-dark-1440.png`. **Suspected source:** `pages/Connections.jsx:20` (`SyncStatus` is not demo-aware).
- **[P2 polish] · /demo/profile:** a dead end with no settings, theme, school or semester editing. "Reset demo" appears twice (sidebar and card). Both call `resetDemo` directly with no confirm (`Sidebar.jsx:117`, `DemoProfile.jsx:5`). **Evidence:** `shots/desktop-18-profile-dark-1440.png`.
- **[P2 polish] · 820x1180 touch:** 51 interactive targets under 32px on Grades. Examples: drag handles 17x17, "Notes" and professor links 16px tall, "+ Grade" 24px tall. Only some carry `hit-44`. **Evidence:** measured rects. **Suspected source:** `CategoryRow.jsx` (GripVertical handle), `CourseCard.jsx`.
- **[P2 polish] · /demo · contrast (Lighthouse):** Home timeline times ("10:00", "13:00", "17:00") are 4.48:1 (`text-base-content/50` on `#151d18`). On the onboarding step counter and footer note, 3.36:1. In light mode the "imported" badge is pale green on white. **Suspected source:** `pages/DemoCommandCenter.jsx` (`w-14 … text-base-content/50`), `OnboardingWizard.jsx` (`text-base-content/40`).
- **[P2 polish] · /login · 1440 (observed only):** Lighthouse a11y 85. The identifier and password inputs have no label, aria-label or placeholder (the visible placeholder is a separate element). The show/hide-password button has no accessible name. The carousel step dots are 20x18px targets. **Suspected source:** `src/pages/Login.jsx:589-622` (custom placeholder overlay, `{...register('identifier')}`), password toggle near `:358`.
- **[P2 polish] · PWA manifest:** `orientation: "portrait-primary"` locks the installed app to portrait wherever the platform honours it (Android tablets, ChromeOS), which suits a desktop or tablet layout poorly. `theme_color` is fixed at `#0b1511` even in the light theme. `shortcuts` point to `/grades` and `/planner` (auth routes; fine for real users). **Suspected source:** `vite.config.js:20`.
- **[P2 polish] · SEO:** `/robots.txt` returns `index.html` (200, text/html) through the SPA fallback, so Lighthouse reports "robots.txt is not valid (64 errors)". **Suspected source:** `public/` has no `robots.txt`.
- **[P2 polish] · perf (bundle):** /demo eagerly loads 8 scripts totalling about 810 KB decoded. That includes `vendor-supabase` at 196 KB (unused in demo) and `vendor-motion` (framer-motion) at 120 KB. The Google Fonts stylesheet is render-blocking (`renderBlockingStatus: blocking`). On localhost, DCL is 108 ms and load 123 ms with JS served from the SW (`transferSize 0`). **Suspected source:** `App.jsx` imports (DemoProvider, AuthContext → supabase), `index.html:55`.
- **[P2 polish] · demo date drift (confirms mobile finding on desktop):** Home says "Tuesday, September 15". The Planner calendar opens on November 2026 with all 3 seeded tasks "Overdue". Ask answers "Your next deadline is Project proposal" (overdue). Life Hub says "135 days until 2027-03-31", computed from the real clock. New tasks default to the real date (Nov 17). **Evidence:** `shots/desktop-08-planner-dark-1440.png`, `shots/desktop-14-ask-dark-1440.png`, `shots/desktop-15-lifehub-dark-1440.png`.

---

## Mobile findings: do they apply on desktop and tablet?

| Mobile finding | Desktop/tablet? | Evidence |
|---|---|---|
| `hsl(var(--p))` invalid → transparent pills, rails, no focus ring | **Yes, all widths.** Also new symptoms: transparent skip link, currentColor card-hover borders, invisible signal bars and progress fill | focus log; `desktop-24`, `desktop-25`, `desktop-05` |
| Light-theme hero near-black on near-black | **Yes** at 1440/1920 | `shots/desktop-20-home-light-1440.png` |
| Content hidden under bottom nav | **No.** Bottom nav is hidden ≥768 (incl. 820 and 1180 iPad) and `main` has `md:pb-0` | layout JSON `bottomNav: none` |
| Demo links to non-demo routes → /login | **Yes.** Grades "Next: …" → `/planner`, Planner course chips → `/grades?course=demo-…` (hrefs in snapshot) | `CourseCard.jsx:182`, TaskItem course link |
| Ask FAB under bottom nav | **N/A.** The FAB is `display:none` ≥768, which is why demo desktop has no Ask shortcut (see the P1 Ctrl+K finding) | `index.css:246` |
| Life Hub selected tab indistinguishable | **Yes** | `shots/desktop-15-lifehub-dark-1440.png` |
| Category pencil/delete overlap + delete without confirm | **Partly.** No visual overlap at 1440, but the 44px hit areas overlap. No confirm: same code path | `CategoryRow.jsx:153-155` |
| Demo date frozen vs real clock | **Yes** | see P2 above |

---

## Keyboard pass (1440, /demo)

- Skip link: **present and works** (Enter → `#main`, next Tab → "Tour"). Its background is transparent (P1 above).
- Focus order: skip link → Home, Ask, Life Hub, Connections, Profile, Grades, Planner, Timetable, Reset demo → Tour → hero CTAs → section links → 4 action rows → footer links → walkthrough close/next → wraps. Logical.
- Focus visibility: 22/24 non-skip stops have `outline: none` and `box-shadow: none`. `.btn-primary` stops have a 2px outline in `oklch(0.2326 …)` (dark on dark).
- Ctrl+K: **does nothing in demo** (P1).
- Modals (What-do-I-need, Add/Edit Task, Add Class): initial focus goes to Close. **Focus is trapped**: 5 Tabs cycled range → checkbox → checkbox → Close → range, all inside the dialog. **Esc closes**, and focus is **restored** to the trigger ("Need?", "Task").
- Theme toggle: operable by Enter (only at <768 in demo); focus is lost afterwards.
- Task checkboxes: Space toggles completion (`Mark "Research participation" complete` → `incomplete`); focus is lost afterwards.
- Life Hub tabs: no arrow-key support. Walkthrough: Esc does nothing.

## Layout measurements

- **Horizontal overflow:** none. At every route and viewport (1280, 1440@1x/2x, 1920, 820, 1180), `documentElement.scrollWidth === innerWidth`, `main.scrollWidth === main.clientWidth`, and no element extends past the viewport.
- **Sidebar/bottom-nav:** sidebar shown and bottom nav hidden at 820 and 1180 (both iPad orientations). At 820 the content gets 580px (see the P1 iPad finding). At 1180 the content gets 940px, which works well.
- **Max content width at 1920:** Home 1220, Life 1280, Connections 896, Ask/Profile 768 (all centred); Grades/Planner/Timetable unbounded at 1680. Longest prose lines: about 115 characters (Ask disclaimer) and 98 characters (Life Hub body at 1920). Main body copy otherwise stays at 70 characters or fewer.
- **Weekly grid:** at 1440, columns are 226px and blocks 221x108 (2h): readable, with good colour coding. Gridlines are very faint and there is no "today" column marker. At 820 the blocks are 100px and truncate.

## Lighthouse

All four `navigation`-mode runs failed with `NO_FCP` ("page did not paint"), on both the isolated and the default context. The browser window is occluded or headless, and a performance trace recorded no paint events either. **The Performance score, LCP and TBT could not be measured honestly here.** The trace gave CLS 0.00. The scores below come from `snapshot` mode, taken after the page had loaded. Snapshot "mobile" reuses the current viewport, so mobile and desktop are identical.

| Page | Form factor | Perf | A11y | Best Pr. | SEO | LCP | TBT | CLS | Top failing audits |
|---|---|---|---|---|---|---|---|---|---|
| /demo (intro screen) | desktop | n/a (NO_FCP) | 94 | 100 | 80 | n/a | n/a | 0.00 (trace) | color-contrast (3.36:1), robots-txt |
| /demo (home, after intro) | desktop | n/a | 92 | 100 | 80 | n/a | n/a | 0.00 | aria-prohibited-attr (walkthrough progress), color-contrast (4.48:1 times), robots-txt |
| /demo (home) | mobile (snapshot) | n/a | 92 | 100 | 80 | n/a | n/a | — | same as above |
| /login | desktop | n/a | 85 | 100 | 80 | n/a | n/a | — | label (identifier/password), button-name (password toggle), target-size (step dots 20x18), robots-txt |
| /login | mobile (snapshot) | n/a | 85 | 100 | 80 | n/a | n/a | — | same as above |

Reports: `lh-*/report.html`.
Perf proxies (localhost, SW-served): TTFB 26 ms, DCL 108 ms, load 123 ms, about 810 KB JS decoded on first route, Google Fonts CSS render-blocking.

## PWA

- Service worker `/sw.js` is `activated`, scope `/`, and `navigator.serviceWorker.controller` is set.
- Manifest link is `/manifest.webmanifest` (200, `application/manifest+json`). It has 64/192/512 and maskable icons, `display: standalone` and `orientation: portrait-primary`.
- Precache `workbox-precache-v2` holds 57 entries including `index.html`.
- Offline (CDP Offline, normal navigation): `/demo` **loads** from the SW. **Fonts do not render**: system fallback is used and no font files are cached (P1 above).
- A hard reload (`ignoreCache`) offline bypasses the SW and shows the Chrome error page. That is expected browser behaviour, not an app bug.
- Online was restored afterwards.

## Console

After every journey there were only DevTools "issue" messages: 16× "No label associated with a form field" and 7× "A form field element should have an id or name attribute". There were no JS errors. Offline produced 3× `ERR_INTERNET_DISCONNECTED`, which is expected for the Google Fonts requests.

## What works well

- No horizontal overflow at any desktop or tablet size. The 3-column Grades masonry, the Planner's list + calendar split and the 2-column Home grid all reflow cleanly from 1180 to 1920.
- The modals are solid: initial focus on Close, a real focus trap, Esc closes, focus returns to the trigger. Task create, edit and complete, filters (type, status, course, date) and the calendar date filter all worked on the first try.
- The What-do-I-need modal is clear and immediately useful ("You need 83.2% on selected remaining assessments") with a live slider and selectable categories.
- The Grades running average, letter and GPA update instantly after a grade is added (92 → 88, A+ → A).
- The weekly grid at 1440 is readable, with colour-coded, well-labelled blocks; overlapping classes get their own columns.
- The skip link exists and targets `#main`, which has `tabIndex -1`. Landmarks (`complementary`, `navigation`, `main`) are present. Planner checkboxes have descriptive names ("Mark "Project proposal" complete").
- Route transitions are a short 250ms CSS fade with no layout shift (CLS 0.00), and `prefers-reduced-motion` is honoured globally.
- The PWA shell, including lazy route chunks, is precached, and the app opens offline.
- Best Practices scored 100 on every page audited.
