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

```bash
# Clone and enter the directory
git clone <repo-url>
cd ultraGrade

# Set up environment variables
cp .env.example .env
# Edit .env: set GEMINI_API_KEY=your_key_here

# Install dependencies (all three locations)
npm install
npm install --prefix server
npm install --prefix client

# Run dev servers
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/api/health
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI Studio key for outline parsing |
| `PORT` | No | Backend port (default: `3001`) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |

Get a free Gemini key at [aistudio.google.com](https://aistudio.google.com).

---

## Project Structure

```
ultraGrade/
├── server/
│   ├── index.js                   # Express app, CORS, routes, error handler
│   ├── routes/
│   │   ├── parseOutline.js        # POST /api/parse-outline (multer + Gemini)
│   │   └── immigration.js         # GET /api/immigration/:section (proxy + cache)
│   └── utils/
│       ├── geminiParser.js        # Gemini API call, JSON extraction, prompt
│       └── immigrationFetcher.js  # Axios fetch + HTML parse + 24hr cache
├── client/
│   ├── src/
│   │   ├── pages/                 # Dashboard, Grades, Timetable, Planner,
│   │   │                          #   Immigration, StudentResources, Settings, Onboarding
│   │   ├── components/            # grades/, timetable/, planner/, dashboard/,
│   │   │                          #   immigration/, layout/, onboarding/, ui/
│   │   ├── context/               # AppContext.jsx — all app state + CRUD
│   │   ├── hooks/                 # useLocalStorage, useGradeCalc
│   │   ├── utils/                 # gradeCalculations, dateHelpers, colorHelpers
│   │   └── data/                  # gpaScales.js, universities.js
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
| PDF export | jsPDF + jspdf-autotable |
| Backend | Node.js + Express |
| AI parsing | Google Gemini (`gemini-2.0-flash-lite`) |
| File uploads | multer |
| PDF parsing | pdf-parse |
| PWA | vite-plugin-pwa + Workbox |

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
