import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import requireAuth from './middleware/requireAuth.js';
import parseOutlineRouter from './routes/parseOutline.js';
import immigrationRouter from './routes/immigration.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/parse-outline', requireAuth, parseOutlineRouter);
app.use('/api/immigration', immigrationRouter);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ultraGrade server running on http://0.0.0.0:${PORT}`);
});
