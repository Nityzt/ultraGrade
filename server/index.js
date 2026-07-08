import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import requireAuth from './middleware/requireAuth.js';
import { rateLimit } from './middleware/rateLimit.js';
import parseOutlineRouter from './routes/parseOutline.js';
import quickAddRouter from './routes/quickAdd.js';
import calendarRouter from './routes/calendar.js';
import accountRouter from './routes/account.js';
import immigrationRouter from './routes/immigration.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

// Behind Render/Vercel proxies — needed for correct req.ip (rate limiting).
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Gemini calls are expensive and quota-limited — throttle per authenticated user.
app.use(
  '/api/parse-outline',
  rateLimit({ name: 'parse-outline', limit: 10, windowMs: 60 * 60 * 1000 }),
  requireAuth,
  parseOutlineRouter
);

// Natural-language quick-add — also Gemini-backed. requireAuth runs FIRST so the
// limiter keys per-user (req.user.id) rather than per-IP.
app.use(
  '/api/quick-add',
  requireAuth,
  rateLimit({ name: 'quick-add', limit: 30, windowMs: 60 * 60 * 1000 }),
  quickAddRouter
);

// Account deletion — JWT-gated so a user can only delete themselves.
app.use('/api/account', requireAuth, accountRouter);

// Public ICS deadline feed — the token in the path is the credential. Throttle
// per IP to blunt token enumeration; calendar clients poll infrequently.
app.use(
  '/api/calendar',
  rateLimit({ name: 'calendar', limit: 60, windowMs: 60 * 1000 }),
  calendarRouter
);

// Public endpoint — throttle per IP to protect the upstream fetch + cache.
app.use(
  '/api/immigration',
  rateLimit({ name: 'immigration', limit: 60, windowMs: 60 * 1000 }),
  immigrationRouter
);

// Unknown API routes → JSON 404 (never fall through to an HTML error page).
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: isProd ? 'Internal server error' : err.message || 'Internal server error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ultraGrade server running on http://0.0.0.0:${PORT}`);
});
