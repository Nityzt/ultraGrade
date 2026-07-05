# ultraGrade

**One-stop academic toolkit for students at Ontario universities.**
Track grades & GPA, manage your timetable, plan assignments, and access live Canadian immigration info — all in one PWA.

![PWA](https://img.shields.io/badge/PWA-installable-0f9d58?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Node](https://img.shields.io/badge/Node.js-Express-68a063?style=flat-square&logo=node.js)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-4285F4?style=flat-square&logo=google)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e?style=flat-square&logo=supabase)

---

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Time-based greeting, permit expiry alert, GPA summary, today's schedule, upcoming deadlines, course status widgets |
| **Grade Calculator** | Weighted categories, drop-lowest, running vs projected grade, "What do I need?" reverse calc |
| **Multi-GPA Scales** | Standard Ontario 4.0, York New 4.0 (A = 3.90 at 85–89%), York Legacy 9.0 |
| **AI Outline Parser** | Upload a course PDF or image — Gemini returns structured JSON for schedule, assessment weights, and deadlines, and resolves relative dates ("Week 5") into real calendar entries using your semester window |
| **Timetable** | Full weekly grid on desktop; day view + day picker on mobile; printable view |
| **Assignment Planner** | Tasks grouped by urgency, deadline calendar, filter by type/status/course |
| **Live Immigration Hub** | Study permit, work rights, PGWP, OHIP (international only) — loads instantly with curated content and upgrades to live gov data via background revalidation |
| **Student Resources** | OSAP, health plans, career links for domestic students |
| **Study Timer** | Pomodoro 25/5 per course with cumulative hour tracking |
| **PDF Transcript Export** | Formatted transcript with grades and GPA (desktop) |
| **Rate My Professors** | School-scoped deep links — pinpoints the professor at *your* university, not a national namesake list |
| **Fast grade entry** | Inline quick-add for grades (type a score, press Enter) and categories — no modal round-trips |
| **Settings** | Name, school, GPA scale, theme, study permit expiry, week start, grade display format |
| **PWA** | Installable on iPhone & Android, works offline with Workbox caching |
| **Auth** | Google OAuth + email/password; JWT-protected AI endpoint |

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier: ~1,500 requests/day)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ultraGrade

# Install all dependencies (root + server + client)
npm run install:all
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run the entire contents of `supabase/migrations/001_initial_schema.sql`
3. **Authentication → Providers → Email** → Enable
4. *(Optional)* **Authentication → Providers → Google** → paste your Google OAuth Client ID + Secret
5. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**` and `http://localhost:5173/reset-password`

### 3. Environment Variables

Two separate `.env` files are required — Vite and the Express server each read their own:

**`server/.env`**
```bash
GEMINI_API_KEY=your_google_ai_studio_key
SUPABASE_URL=https://your-project.supabase.co
CLIENT_URL=http://localhost:5173
PORT=3001
# Optional — distributed rate limiting (falls back to in-memory if unset)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**`client/.env`**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=       # leave empty for local dev; set to Render URL in production
```

> `VITE_SUPABASE_ANON_KEY` is intentionally public — Row Level Security enforces data isolation.

### 4. Run

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/api/health
```

---

## Environment Variables Reference

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI Studio key for course outline parsing |
| `SUPABASE_URL` | Yes | Used for JWT JWKS verification |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |
| `PORT` | No | Backend port (default: `3001`) |
| `UPSTASH_REDIS_REST_URL` | No | Enables distributed rate limiting; in-memory fallback if unset |
| `UPSTASH_REDIS_REST_TOKEN` | No | Paired with the Upstash URL above |

### `client/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_API_URL` | No | Backend base URL — empty in dev, Render URL in production |

---

## Project Structure

```
ultraGrade/
├── package.json                    # Root: concurrently dev script + install:all
├── render.yaml                     # Render backend deployment config
├── supabase/migrations/
│   └── 001_initial_schema.sql      # Full DB schema — run once in Supabase SQL Editor
│
├── server/                         # Node.js + Express backend
│   ├── index.js                    # App entry, CORS, routes
│   ├── middleware/requireAuth.js   # JWT verification via Supabase JWKS (jose)
│   ├── routes/
│   │   ├── parseOutline.js         # POST /api/parse-outline [JWT protected]
│   │   └── immigration.js          # GET /api/immigration/:section [public]
│   └── utils/
│       ├── geminiParser.js         # Gemini API call + JSON extraction
│       └── immigrationFetcher.js   # Live fetch from Canada.ca + 24hr cache
│
└── client/                         # React + Vite frontend
    ├── vercel.json                 # SPA rewrites + cache headers
    ├── vite.config.js              # PWA plugin, /api proxy
    ├── tailwind.config.js          # DaisyUI obsidian+sage / paper+emerald themes
    └── src/
        ├── main.jsx                # Provider tree: Auth > AuthGate > App > AppContext
        ├── App.jsx                 # Routes + auth guards
        ├── context/
        │   ├── AuthContext.jsx     # Supabase session, signIn/signOut
        │   └── AppContext.jsx      # All app state, CRUD, Supabase sync
        ├── pages/                  # Dashboard, Grades, Timetable, Planner,
        │                           #   Immigration, StudentResources, Settings,
        │                           #   Login, Onboarding, ResetPassword
        ├── components/
        │   ├── grades/             # CourseCard, modals, StudyTimer, WhatDoINeed
        │   ├── dashboard/          # 5 dashboard widgets
        │   ├── timetable/          # WeeklyGrid, DayView, PrintView
        │   ├── planner/            # TaskList, TaskFilterBar, DeadlineCalendar
        │   ├── immigration/        # InfoSection, WorkRightsTable, ResourceCard
        │   ├── layout/             # Sidebar, BottomNav, Header, Layout
        │   └── ui/                 # Modal, ProgressRing, Badge, ConfirmDialog, etc.
        ├── hooks/                  # useGradeCalc, useSupabaseLoader, useSupabaseSync
        ├── utils/                  # gradeCalculations, dateHelpers, colorHelpers,
        │                           #   migrationUtils (all with Vitest tests)
        └── data/                   # gpaScales.js, universities.js
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS v3 + DaisyUI v4 — "Obsidian + Sage" glass design system (dark sage / light emerald), Hanken Grotesk |
| Routing | react-router-dom v6 |
| Animations | framer-motion |
| Forms | react-hook-form |
| Icons | lucide-react |
| HTTP | axios |
| Auth + DB | Supabase (Google OAuth + email/password, PostgreSQL + RLS) |
| PDF export | jsPDF + jspdf-autotable |
| Backend | Node.js + Express |
| AI parsing | Google Gemini `gemini-2.5-flash` |
| File uploads | multer (memory storage) |
| PDF text extraction | pdf-parse |
| JWT verification | jose (JWKS endpoint) |
| PWA | vite-plugin-pwa + Workbox |
| Tests | Vitest + jsdom (~100 unit tests) |
| Deployment | Vercel (frontend) + Render (backend) + Supabase (DB/auth) |

---

## GPA Scales

| Scale | Used By | Key Detail |
|-------|---------|------------|
| **Standard Ontario 4.0** | U of T, Waterloo, Western, Queen's, McMaster, Carleton, Ottawa + most others | A+/A ≥ 85% = 4.00 |
| **York New 4.0** | York University (current) | A (85–89%) = 3.90 — unique York split |
| **York Legacy 9.0** | York University (pre-2009) | Max 9.00; A+ = 9.00, A = 8.00 |

Select your scale in **Settings → School**. It auto-suggests the correct scale when you choose your university.

---

## AI Course Outline Parser

On the **Grades** page, click **Import from Outline** when adding a course.

1. Upload a `.pdf`, `.png`, `.jpg`, or `.jpeg` of your course syllabus (max 10 MB)
2. Gemini extracts, as structured JSON: course name/code, professor, credit hours, weekly schedule, assessment weights, and dated deadlines. The active semester's start/end dates are sent along so relative references ("Week 5", "Oct 12", "third Friday") resolve to absolute calendar dates.
3. Review the parsed preview — it spells out how many grade categories, timetable slots, and calendar deadlines will be created; nothing is saved yet
4. Click **Import to ultraGrade** — course, timetable entries, and tasks are all created automatically

> Uses `gemini-2.5-flash` with JSON structured output (`responseSchema`) and a small retry/backoff for transient 503s (free tier: ~1,500 requests/day). If you get a quota error, the free-tier daily limit has been hit — wait for the reset or enable billing at [Google AI Studio](https://aistudio.google.com). To change models, edit `MODEL` in `server/utils/geminiParser.js`.

---

## Immigration Hub

> International students only — toggle your type in **Settings → Profile → Student Type**.

Sections:

- **Study Permit** — conditions and restrictions
- **Work Rights** — off-campus hours during academic sessions
- **PGWP** — Post-Graduation Work Permit eligibility
- **OHIP** — provincial health coverage eligibility

The page **never blocks on a slow government host**. Curated content renders immediately; sections marked `preferLive` warm live gov data in the background (stale-while-revalidate, 24 h cache, 10 min negative cache) so the next visit upgrades automatically. The explicit **Refresh** button awaits a live fetch. Each section shows the source URL and last-fetched time.

> Always verify with your school's international student office.

---

## Install on Your Phone (PWA)

### iPhone / iPad
1. Open in **Safari** → tap **Share** → **Add to Home Screen** → **Add**

### Android
1. Open in **Chrome** → tap **⋮** → **Add to Home Screen / Install app** → **Install**

The app works offline once installed — grades, timetable, and tasks are always accessible.

---

## Deployment

### Backend — [Render](https://render.com)
1. New Web Service → connect GitHub repo
2. Root directory: `server`, start command: `npm start`
3. Set env vars: `GEMINI_API_KEY`, `SUPABASE_URL`, `CLIENT_URL` (your Vercel URL, no trailing slash), `PORT`
4. Copy the Render URL (current production: `https://ultragrade.onrender.com`)

### Frontend — [Vercel](https://vercel.com)
1. New project → import repo → **Root directory**: `client`
2. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (your Render URL, no trailing slash)
3. Deploy → copy the Vercel URL (current production: `https://ultra-grade.vercel.app`)

### Post-deployment
- Render `CLIENT_URL`: `https://ultra-grade.vercel.app`
- Vercel `VITE_API_URL`: `https://ultragrade.onrender.com`
- Supabase → **Authentication → URL Configuration**:
  - Site URL: `https://ultra-grade.vercel.app`
  - Redirect URLs: `https://ultra-grade.vercel.app/**`, `https://ultra-grade.vercel.app/reset-password`, and the localhost URLs used for development
- If using Google OAuth: Google Cloud Console → OAuth client:
  - Authorized JavaScript origins: `https://ultra-grade.vercel.app`, plus `http://localhost:5173` for development
  - Authorized redirect URIs: the Supabase callback URL from Supabase's Google provider settings
- After changing Vercel env vars, trigger a fresh production redeploy. Vite bakes `VITE_*` values into the static build.

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/your-feature`
2. Read `CLAUDE.md` for architecture, data models, and conventions
3. Run `npm run dev` and test locally
4. After any notable change — update **both `README.md` and `CLAUDE.md`** in the same PR
5. Open a pull request

---

## License

MIT — use it, fork it, build on it.
