# ultraGrade

**An all-in-one academic planner for Ontario university students.** It tracks grades and GPA, the class timetable and deadlines, and live Canadian immigration rules, in one installable web app.

**Live:** [ultra-grade.vercel.app](https://ultra-grade.vercel.app) · **Stack:** React, Node.js/Express, Supabase (PostgreSQL), Google Gemini AI, PWA

---

## The problem
Students juggle a spreadsheet for grades, a calendar for classes, a to-do app for deadlines and scattered government pages for study-permit rules. Setting up a new course means typing every weight and due date by hand from a PDF syllabus. Ontario universities also use different GPA scales; York, for example, has its own.

## The solution
ultraGrade brings this into one place and automates the tedious parts:
- **AI syllabus import:** upload a course outline (PDF or image) and the app creates the course, its grade weights, class times and deadlines.
- **Plain-English quick add:** type something like "essay due next Friday, 20%" or "got 85 on the CS350 midterm", review the preview, and confirm.
- **Grade maths:** weighted categories, drop-lowest rules, multiple GPA scales, and "what mark do I need on the final?"
- **Planner and timetable:** deadlines grouped by urgency, a weekly class grid, and calendar sync to Google, Apple and Outlook.
- **International student hub:** study permit, work rights, PGWP and OHIP information, refreshed in the background from official Government of Canada pages.
- **Works like a native app:** installs on iPhone and Android, works offline, and supports dark and light themes.

## Technical highlights
| Area | What it does |
|---|---|
| **AI pipeline** | Gemini returns structured JSON that is validated server-side with Zod. Invented IDs are dropped, and relative dates ("Week 5") are resolved against the semester. |
| **Security** | Supabase Row-Level Security isolates each user's data. AI endpoints require a verified JWT and are rate-limited. Uploads are processed in memory and never stored. |
| **Offline-first** | Updates are optimistic with rollback, data is cached locally, and a service worker (Workbox) keeps the app usable without a connection. |
| **Quality** | 99 automated tests (Vitest and the Node test runner), with CI that runs tests, dependency audits and a production build. |
| **Demo mode** | `/demo` runs the full app on seeded, in-memory data with no account and no backend calls. |

## Architecture
```
client/   React 18 + Vite + Tailwind/DaisyUI   → deployed on Vercel (installable PWA)
server/   Node.js + Express API (AI parsing, calendar feed, immigration data) → Render
supabase/ PostgreSQL schema + migrations (auth, data, row-level security)
```

## Run it locally
**Requirements:** Node 18+, a Supabase project and a Google AI Studio API key (both have free tiers).

```bash
npm run install:all
cp .env.example server/.env       # fill in GEMINI_API_KEY, SUPABASE_URL
cp .env.example client/.env       # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev                       # app on http://localhost:5173, API on :3001
```

Database setup: run the SQL files in `supabase/migrations/` in numeric order, then enable email (and optionally Google) sign-in in Supabase Auth.

To skip setup entirely, run only the client (`npm run dev:client`) and open `/demo`.

**Checks before deploying:** `npm test`, `npm run audit`, `npm run build`.

## Project status
A design overhaul is in progress on the `ui/flat-overhaul` branch. It aims for a flatter, faster interface with better mobile ergonomics. The plan and progress are tracked in [issue #12](https://github.com/Nityzt/ultraGrade/issues/12).

## License
MIT
