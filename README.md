# ultraGrade

**One-stop academic toolkit for students at Ontario universities.**
Track grades & GPA, manage your timetable, plan assignments, and access live Canadian immigration info — all in one place.

![PWA](https://img.shields.io/badge/PWA-installable-818cf8?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Node](https://img.shields.io/badge/Node.js-Express-68a063?style=flat-square&logo=node.js)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-4285F4?style=flat-square&logo=google)

---

## Features

- **Grade Calculator** — Weighted categories, drop-lowest, running vs projected grade, "What do I need?" reverse calc
- **Multi-GPA Scales** — Standard Ontario 4.0, York New 4.0 (A = 3.90 at 85–89%), York Legacy 9.0
- **Timetable** — Full weekly grid on desktop; day view + day picker on mobile
- **Assignment Planner** — Tasks grouped by urgency (Overdue / Today / This Week / Later), mini calendar
- **AI Outline Parser** — Upload a course outline PDF or image; Gemini extracts schedule, assessments & deadlines automatically
- **Live Immigration Hub** — Fetched live from official Canada.ca pages (study permit, work rights, PGWP, OHIP)
- **International vs Domestic mode** — Immigration hub for international students; OSAP/OHIP resource page for domestic
- **Rate My Professors** — Deep links to RMP for your professor and course
- **Study Timer** — Pomodoro 25/5 per course, tracks cumulative study hours
- **Course Notes** — Per-course notes field, collapsed by default
- **PDF Transcript Export** — Desktop-only; generates formatted PDF with grades & GPA
- **PWA** — Installable on iPhone & Android, works offline

---

## For Me (Quick Start)

```bash
# Already cloned? Just make sure .env has your Gemini key
cp .env.example .env
# Edit .env: set GEMINI_API_KEY=your_key

# Install everything
npm install
npm install --prefix server
npm install --prefix client

# Run dev
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:3001
```

---

## For Collaborators & Friends

### Prerequisites

- **Node.js** v18 or higher ([download](https://nodejs.org))
- **npm** v9+
- A **Gemini API key** (free tier works) from [Google AI Studio](https://aistudio.google.com)

### Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd ultraGrade

# 2. Set up environment variables
cp .env.example .env
```

Open `.env` and fill in:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
```

```bash
# 3. Install dependencies (all three locations)
npm install                    # root (installs concurrently)
npm install --prefix server    # backend
npm install --prefix client    # frontend
```

### Running the App

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health check**: http://localhost:3001/api/health

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key for course outline parsing |
| `PORT` | No | Backend port (default: `3001`) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |

---

### Project Structure

```
ultraGrade/
├── server/                    # Node.js + Express backend
│   ├── index.js               # Express app entry point
│   ├── routes/
│   │   ├── parseOutline.js    # POST /api/parse-outline
│   │   └── immigration.js     # GET /api/immigration/:section
│   └── utils/
│       ├── geminiParser.js    # Gemini AI integration
└──       └── immigrationFetcher.js  # Live immigration data proxy
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/             # One file per page/route
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # AppContext (all app state)
│   │   ├── hooks/             # useLocalStorage, useGradeCalc
│   │   ├── utils/             # Grade math, date helpers, color helpers
│   │   └── data/              # GPA scales, university RMP IDs
│   └── vite.config.js
├── package.json               # Root: runs both servers via concurrently
└── .env.example               # Environment variable template
```

---

### Tech Stack

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

## GPA Scales Supported

| Scale | Used By | Key Info |
|-------|---------|----------|
| Standard Ontario 4.0 | U of T, Waterloo, Western, Queen's, McMaster... | A+/A ≥ 85% = 4.00 |
| York New 4.0 | York University (current) | A = 3.90 at 85–89% (York-specific) |
| York Legacy 9.0 | York University (pre-2009) | Max 9.00; A+ = 9.00, A = 8.00 |

Select your scale in Settings. It auto-suggests based on your school.

---

## AI Course Outline Parser

On the Grades page, click **"Import from Outline"** when adding a course.

1. Upload a `.pdf`, `.png`, `.jpg`, or `.jpeg` of your course syllabus
2. Gemini AI extracts: course name/code, professor, credit hours, weekly schedule, assessment weights, and deadline dates
3. Review and confirm a preview before anything is imported
4. On confirm: course is created, timetable entries are added, and tasks are created automatically

> Uses `gemini-2.0-flash-lite` by default (cheap + fast). Upgrade to `gemini-1.5-pro` in `server/utils/geminiParser.js` for better accuracy.

---

## Immigration Hub

> For international students only (switchable in Settings)

Information is fetched live from official government websites every 24 hours:
- **Study Permit** conditions
- **Work Rights** while studying (24 hrs/week off-campus during academic sessions)
- **PGWP** (Post-Graduation Work Permit) eligibility
- **OHIP** health coverage eligibility

Each section shows the source URL, last-fetched timestamp, and a Refresh button. If the fetch fails, cached fallback content is shown with a warning.

> Always verify with your school's international student office for your specific situation.

---

## Install on Your Phone (PWA)

### iPhone / iPad (iOS)
1. Open the app in **Safari** at `http://localhost:5173`
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add**

### Android
1. Open the app in **Chrome** at `http://localhost:5173`
2. Tap the **three-dot menu**
3. Tap **"Add to Home Screen"** or **"Install app"**
4. Tap **Install**

The app works offline once installed — your grades, timetable, and tasks are always accessible.

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make changes — read `CLAUDE.md` for architecture details
4. Test locally with `npm run dev`
5. Open a pull request

Keep changes focused. If you're adding a new feature, update `CLAUDE.md` with any architecture changes.

---

## License

MIT — use it, fork it, build on it.
