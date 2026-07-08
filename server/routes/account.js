import express from 'express';
import { getServiceClient } from '../lib/supabase.js';

const router = express.Router();

/**
 * DELETE /api/account — permanently delete the authenticated user.
 *
 * Uses the service-role admin API to remove the auth.users row; every data
 * table references auth.users(id) ON DELETE CASCADE, so all of the user's
 * semesters/courses/grades/tasks/etc. are removed with it.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Without it we 503 (feature disabled)
 * rather than pretending to delete. requireAuth (mounted upstream) guarantees
 * req.user.id, so a user can only ever delete themselves.
 */
router.delete('/', async (req, res) => {
  const supabase = getServiceClient();
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Account deletion is not configured on this server.' });
  }
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Account deletion error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete account. Please try again.' });
  }
});

export default router;
