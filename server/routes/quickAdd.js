import express from 'express';
import { parseQuickAdd } from '../utils/quickAddParser.js';

const router = express.Router();

// Cap how much text (and how many courses) we forward to Gemini.
const MAX_TEXT = 500;
const MAX_COURSES = 40;

router.post('/', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ success: false, error: 'Nothing to add — type something first.' });

    const rawCourses = Array.isArray(req.body?.courses) ? req.body.courses.slice(0, MAX_COURSES) : [];
    const courses = rawCourses
      .filter((c) => c && typeof c.id === 'string')
      .map((c) => ({ id: c.id, code: String(c.code || ''), name: String(c.name || '') }));

    const context = {
      courses,
      currentDate: new Date().toISOString().slice(0, 10),
    };

    const data = await parseQuickAdd(text.slice(0, MAX_TEXT), context);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Quick-add error:', err);
    const msg = err.message || '';
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many requests')) {
      return res.status(429).json({ success: false, error: 'AI quota exceeded. Free-tier limits reset daily — try again later.' });
    }
    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
      return res.status(500).json({ success: false, error: 'AI model unavailable. Check server configuration.' });
    }
    if (msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('high demand')) {
      return res.status(503).json({ success: false, error: 'The AI service is briefly overloaded. Please try again in a moment.' });
    }
    // Validation errors from quickAddSchema carry a user-friendly message.
    if (msg.includes('understand') || msg.includes('detail')) {
      return res.status(422).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Could not add that. Please try again.' });
  }
});

export default router;
