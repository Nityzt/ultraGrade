import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { parseOutlineWithGemini } from '../utils/geminiParser.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('outline'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const { mimetype, buffer } = req.file;
    let data;

    if (mimetype === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      const text = parsed.text.slice(0, 8000);
      data = await parseOutlineWithGemini(text, null, null);
    } else if (mimetype.startsWith('image/')) {
      const imageBase64 = buffer.toString('base64');
      data = await parseOutlineWithGemini(null, imageBase64, mimetype);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type. Use PDF or image.' });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Parse outline error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to parse outline' });
  }
});

export default router;
