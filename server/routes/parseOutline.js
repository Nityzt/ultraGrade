import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { parseOutlineWithGemini } from '../utils/geminiParser.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
    cb(null, allowed);
  },
});

router.post('/', upload.single('outline'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const { mimetype, buffer } = req.file;
    // Optional semester context (multipart text fields) helps Gemini resolve
    // relative deadline references like "Week 5" into real calendar dates.
    const context = {
      semesterName: req.body.semesterName || '',
      semesterStart: req.body.semesterStart || '',
      semesterEnd: req.body.semesterEnd || '',
      currentYear: new Date().getFullYear(),
    };
    let data;

    if (mimetype === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      const text = parsed.text.slice(0, 8000);
      data = await parseOutlineWithGemini(text, null, null, context);
    } else if (mimetype.startsWith('image/')) {
      const imageBase64 = buffer.toString('base64');
      data = await parseOutlineWithGemini(null, imageBase64, mimetype, context);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type. Use PDF or image.' });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Parse outline error:', err);
    const msg = err.message || '';
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many requests')) {
      return res.status(429).json({ success: false, error: 'Gemini API quota exceeded. Free-tier limits reset daily — try again tomorrow, or add billing at aistudio.google.com.' });
    }
    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
      return res.status(500).json({ success: false, error: 'AI model unavailable. Please check your GEMINI_API_KEY and server configuration.' });
    }
    if (msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('high demand')) {
      return res.status(503).json({ success: false, error: 'The AI service is briefly overloaded. Please try again in a moment.' });
    }
    res.status(500).json({ success: false, error: 'Failed to parse outline. Please try again.' });
  }
});

export default router;
