import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import requireAuth from './middleware/requireAuth.js';
import { rateLimit } from './middleware/rateLimit.js';
import parseOutlineRouter from './routes/parseOutline.js';
import immigrationRouter from './routes/immigration.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Behind Render/Vercel proxies — needed for correct req.ip (rate limiting).
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Gemini calls are expensive and quota-limited — throttle per authenticated user.
app.use(
  '/api/parse-outline',
  rateLimit({ name: 'parse-outline', limit: 10, windowMs: 60 * 60 * 1000 }),
  requireAuth,
  parseOutlineRouter
);

// Public endpoint — throttle per IP to protect the upstream fetch + cache.
app.use(
  '/api/immigration',
  rateLimit({ name: 'immigration', limit: 60, windowMs: 60 * 1000 }),
  immigrationRouter
);

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
