# ultraGrade

An all-in-one academic planner for Ontario university students: grades, GPA, timetable, deadlines and study-permit information in one installable web app.

**Live:** [ultra-grade.vercel.app](https://ultra-grade.vercel.app) · **Demo:** [ultra-grade.vercel.app/demo](https://ultra-grade.vercel.app/demo) (no sign-up)

## Why
Students keep grades in spreadsheets, classes in calendars and deadlines in to-do apps, and they type every course detail in by hand from a PDF syllabus. ultraGrade puts it all in one place and uses AI to do the data entry.

## Features
- **Syllabus import:** upload a course outline and AI creates the course, its grade weights, class times and deadlines.
- **Plain-English quick add:** "essay due Friday, 20%" becomes a task, after you confirm a preview.
- **Grade and GPA calculator:** weighted grades, multiple Ontario GPA scales, and "what do I need on the final?"
- **Works offline:** installs on phones like a native app.

## Tech
React · Node.js/Express · PostgreSQL (Supabase) · Google Gemini · PWA · Vitest. Deployed on Vercel and Render.

## Run locally
```bash
npm run install:all
npm run dev:client   # open http://localhost:5173/demo
```
The full app also needs Supabase and Gemini keys; see `.env.example`.

## License
MIT
