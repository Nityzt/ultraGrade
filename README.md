# ultraGrade

**One-stop academic toolkit for students at Ontario universities.**
Track grades & GPA, manage your timetable, plan assignments, and access live Canadian immigration info — all in one place.

![PWA](https://img.shields.io/badge/PWA-installable-818cf8?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Node](https://img.shields.io/badge/Node.js-Express-68a063?style=flat-square&logo=node.js)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-4285F4?style=flat-square&logo=google)

---

## Features

- **Dashboard** — At-a-glance GPA summary, today's schedule, upcoming deadlines, course status cards, and quick stats
- **Grade Calculator** — Weighted categories, drop-lowest, running vs projected grade, "What do I need?" reverse calc
- **Multi-GPA Scales** — Standard Ontario 4.0, York New 4.0 (A = 3.90 at 85–89%), York Legacy 9.0
- **Timetable** — Full weekly grid on desktop; day view + day picker on mobile; printable view
- **Assignment Planner** — Tasks grouped by urgency (Overdue / Today / This Week / Later), mini deadline calendar
- **AI Outline Parser** — Upload a course outline PDF or image; Gemini extracts schedule, assessments & deadlines automatically
- **Live Immigration Hub** — Fetched live from official Canada.ca pages (study permit, work rights, PGWP, OHIP)
- **International vs Domestic mode** — Immigration hub for international students; OSAP/OHIP resource page for domestic
- **Rate My Professors** — Deep links to RMP for your professor and course
- **Study Timer** — Pomodoro 25/5 per course, tracks cumulative study hours
- **Course Notes** — Per-course notes field, collapsed by default
- **PDF Transcript Export** — Desktop-only; generates formatted PDF with grades & GPA
- **Settings** — Profile, school selector, GPA scale switcher, theme, study permit expiry tracker, danger zone (clear data)
- **PWA** — Installable on iPhone & Android, works offline

---

## Quick Start

### Prerequisites
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (for outline parsing)

### Setup

```bash
# Clone and enter the directory
git clone <repo-url>
cd ultraGrade

# Install dependencies (all three locations)
npm install
npm install --prefix server
npm install --prefix client
```

**Supabase setup (required):**
1. Create a project at supabase.com
2. Run `supabase/migrations/001_initial_schema.sql` in Supabase → SQL Editor
3. Enable Email auth: Authentication → Providers → Email → Enable
4. (Optional) Enable Google OAuth: Authentication → Providers → Google → paste credentials
5. Set redirect URLs: Authentication → URL Configuration
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`

**Environment variables — two separate files:**

```bash
# server/.env
GEMINI_API_KEY=your_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co

# client/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=   # leave empty for local dev
```

```bash
# Run dev servers
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/api/health
```

---

## Environment Variables

Two separate `.env` files are required (see Quick Start for details).

**`server/.env`**

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI Studio key for outline parsing |
| `SUPABASE_URL` | Yes | Supabase project URL (for JWT verification) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |
| `PORT` | No | Backend port (default: `3001`) |

**`client/.env`**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (safe to expose — RLS enforces isolation) |
| `VITE_API_URL` | No | Backend base URL — empty in dev (Vite proxy handles it), Render URL in production |

Get a free Gemini key at [aistudio.google.com](https://aistudio.google.com).

---

## Project Structure

```
ultraGrade/
├── render.yaml                    # Render deployment config (backend)
├── supabase/migrations/           # 001_initial_schema.sql — run once in Supabase SQL Editor
├── server/
│   ├── index.js                   # Express app, CORS, routes, error handler
│   ├── middleware/
│   │   └── requireAuth.js         # JWT verification via Supabase JWKS (jose)
│   ├── routes/
│   │   ├── parseOutline.js        # POST /api/parse-outline (multer + Gemini) [JWT protected]
│   │   └── immigration.js         # GET /api/immigration/:section (proxy + cache) [public]
│   └── utils/
│       ├── geminiParser.js        # Gemini API call, JSON extraction, prompt
│       └── immigrationFetcher.js  # Axios fetch + HTML parse + 24hr cache
├── client/
│   ├── src/
│   │   ├── lib/supabase.js        # Supabase client singleton
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Session state, signIn*, signOut
│   │   │   └── AppContext.jsx     # All app state + CRUD + Supabase sync
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Google OAuth + email/password + forgot password
│   │   │   ├── ResetPassword.jsx  # Password reset (handles PKCE + implicit flow)
│   │   │   ├── Onboarding.jsx     # First-login student type selector
│   │   │   ├── Dashboard.jsx      # GPA summary, schedule, deadlines, stats
│   │   │   ├── Grades.jsx         # Grade calculator, outline import
│   │   │   ├── Timetable.jsx      # Weekly grid + day view
│   │   │   ├── Planner.jsx        # Tasks grouped by urgency, deadline calendar
│   │   │   ├── Immigration.jsx    # Live Canada.ca immigration info (international)
│   │   │   ├── StudentResources.jsx # OSAP/OHIP resources (domestic)
│   │   │   └── Settings.jsx       # Profile, GPA scale, theme, danger zone
│   │   ├── components/            # grades/, timetable/, planner/, dashboard/,
│   │   │                          #   immigration/, layout/, migration/, ui/
│   │   ├── hooks/                 # useLocalStorage, useGradeCalc,
│   │   │                          #   useSupabaseLoader, useSupabaseSync
│   │   ├── utils/                 # gradeCalculations (+ tests), dateHelpers (+ tests),
│   │   │                          #   colorHelpers, migrationUtils (+ tests)
│   │   └── data/                  # gpaScales.js, universities.js
│   ├── vercel.json                # Vercel SPA rewrites + cache headers
│   └── vite.config.js             # PWA plugin, /api proxy → localhost:3001
├── package.json                   # Root: runs both servers via concurrently
└── .env.example                   # Environment variable template
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS v3 + DaisyUI v4 |
| Routing | react-router-dom v6 |
| Animations | framer-motion |
| Forms | react-hook-form |
| Icons | lucide-react |
| HTTP client | axios |
| Auth + database | Supabase (Google OAuth + email/password) |
| PDF export | jsPDF + jspdf-autotable |
| Backend | Node.js + Express |
| AI parsing | Google Gemini (`gemini-2.0-flash-lite`) |
| File uploads | multer |
| PDF parsing | pdf-parse |
| JWT auth | jose (JWKS verification) |
| PWA | vite-plugin-pwa + Workbox |
| Tests | Vitest + jsdom (81 unit tests) |

---

## GPA Scales

| Scale | Used By | Key Detail |
|-------|---------|------------|
| Standard Ontario 4.0 | U of T, Waterloo, Western, Queen's, McMaster, Carleton, Ottawa | A+/A ≥ 85% = 4.00 |
| York New 4.0 | York University (current) | A = 3.90 at 85–89% (York-specific split) |
| York Legacy 9.0 | York University (pre-2009) | Max 9.00; A+ = 9.00, A = 8.00 |

Select your scale in **Settings**. It auto-suggests based on the school you pick.

---

## AI Course Outline Parser

On the Grades page, click **"Import from Outline"** when adding a course.

1. Upload a `.pdf`, `.png`, `.jpg`, or `.jpeg` of your course syllabus
2. Gemini extracts: course name/code, professor, credit hours, weekly schedule, assessment weights, and deadline dates
3. Review and confirm a preview before anything is saved
4. On confirm: course is created, timetable entries added, and tasks created automatically

> Uses `gemini-2.0-flash-lite` by default (cheap + fast). Switch to `gemini-1.5-pro` in `server/utils/geminiParser.js` for better accuracy on complex outlines.

---

## Immigration Hub

> For international students only — toggle in Settings under Student Type.

Fetched live from official government sources every 24 hours:

- **Study Permit** — conditions and restrictions
- **Work Rights** — off-campus hours during academic sessions (24 hrs/week)
- **PGWP** — Post-Graduation Work Permit eligibility
- **OHIP** — provincial health coverage eligibility

Each section shows the source URL, last-fetched timestamp, and a Refresh button. Cached fallback content is shown if the live fetch fails.

> Always verify specifics with your school's international student office.

---

## Install on Your Phone (PWA)

### iPhone / iPad
1. Open the app in **Safari**
2. Tap **Share** → **Add to Home Screen** → **Add**

### Android
1. Open the app in **Chrome**
2. Tap **⋮** → **Add to Home Screen** / **Install app** → **Install**

The app works offline once installed — grades, timetable, and tasks are always accessible.

---

## Deployment

### Backend — [Render](https://render.com) (free tier)
1. New Web Service → connect GitHub repo
2. Root directory: `server`, start command: `npm start`
3. Add env vars: `GEMINI_API_KEY`, `SUPABASE_URL`, `CLIENT_URL` (Vercel URL), `PORT`
4. Copy the Render URL (e.g. `https://ultragrade-server.onrender.com`)

### Frontend — [Vercel](https://vercel.com)
1. New project → import GitHub repo → Root directory: `client`
2. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (Render URL)
3. Deploy → copy the Vercel URL

### After both are deployed
- Update Render `CLIENT_URL` → Vercel URL
- Supabase → Authentication → URL Configuration: add Vercel URL to Site URL and Redirect URLs
- Google Cloud Console → OAuth client: add Vercel URL to Authorized JavaScript Origins

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make changes — read `CLAUDE.md` for architecture and data model details
4. Test locally with `npm run dev`
5. Open a pull request

If you add a feature that changes architecture, data models, or routing, update `CLAUDE.md` in the same PR.

---

## License

MIT — use it, fork it, build on it.
