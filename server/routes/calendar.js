import express from 'express';
import { getServiceClient } from '../lib/supabase.js';
import { buildIcs } from '../utils/ics.js';

const router = express.Router();

/**
 * Public ICS deadline feed:  GET /api/calendar/:token.ics
 *
 * The token IS the credential (a per-user secret from profiles.ics_token), so
 * there is no JWT here — this is the URL a user pastes into Google/Apple/Outlook
 * "subscribe by URL". Looked up via the service-role client (bypasses RLS).
 * Rate-limited per IP upstream to blunt token enumeration.
 */
router.get('/:token', async (req, res) => {
  const supabase = getServiceClient();
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Calendar feed is not configured on this server.' });
  }

  const token = String(req.params.token || '').replace(/\.ics$/i, '').trim();
  if (!token || token.length < 16) {
    return res.status(400).json({ success: false, error: 'Invalid calendar token.' });
  }

  try {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, student_name')
      .eq('ics_token', token)
      .maybeSingle();

    if (pErr) throw pErr;
    if (!profile) return res.status(404).json({ success: false, error: 'Calendar not found.' });

    const [{ data: taskRows, error: tErr }, { data: courseRows, error: cErr }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, due_date, due_time, description, completed, course_id')
        .eq('user_id', profile.id),
      supabase.from('courses').select('id, code').eq('user_id', profile.id),
    ]);
    if (tErr) throw tErr;
    if (cErr) throw cErr;

    const codeById = new Map((courseRows || []).map((c) => [c.id, c.code]));

    const tasks = (taskRows || [])
      .filter((t) => t.due_date && !t.completed)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_date,
        dueTime: t.due_time,
        description: t.description,
        courseCode: t.course_id ? codeById.get(t.course_id) : '',
      }));

    const name = profile.student_name ? `${profile.student_name} · ultraGrade` : 'ultraGrade Deadlines';
    const ics = buildIcs({ calendarName: name, tasks });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="ultragrade.ics"');
    // Let calendar clients cache briefly; they poll on their own cadence anyway.
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(ics);
  } catch (err) {
    console.error('ICS feed error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to build calendar feed.' });
  }
});

export default router;
