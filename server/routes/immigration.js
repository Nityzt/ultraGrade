import express from 'express';
import { fetchSection } from '../utils/immigrationFetcher.js';

const router = express.Router();

router.get('/:section', async (req, res) => {
  const { section } = req.params;
  const validSections = ['study-permit', 'work-rights', 'pgwp', 'ohip'];
  if (!validSections.includes(section)) {
    return res.status(400).json({ success: false, error: 'Unknown section' });
  }
  try {
    const data = await fetchSection(section);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Immigration fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
