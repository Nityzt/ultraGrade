-- ============================================================================
-- Migration 002 — Calendar sync (ICS export + Google connect) + immigration cache
-- Run in Supabase Dashboard → SQL Editor after 001_initial_schema.sql.
-- Safe to re-run (idempotent guards).
-- ============================================================================

-- ── Calendar sync columns on profiles ───────────────────────────────────────
-- ics_token: a per-user secret embedded in the subscribe URL
--   (GET /api/calendar/:token.ics). NULL until the user turns the feed on.
-- calendar_connected: whether the user has linked Google Calendar (import).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ics_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_connected BOOLEAN NOT NULL DEFAULT false;

-- The ICS route looks a user up by this token via the service-role client, so it
-- must be unique. Partial index skips the many NULLs (feed disabled).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_ics_token_key
  ON profiles (ics_token) WHERE ics_token IS NOT NULL;

-- ── Immigration content cache ───────────────────────────────────────────────
-- Written ONLY by the server's service-role client (a Render background job that
-- revalidates canada.ca / ontario.ca). The browser never reads this table
-- directly — it goes through GET /api/immigration/:section — so no public RLS
-- policy is granted; the service role bypasses RLS.
CREATE TABLE IF NOT EXISTS immigration_cache (
  section     TEXT PRIMARY KEY,
  title       TEXT,
  content     TEXT,
  source_url  TEXT,
  fetched_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE immigration_cache ENABLE ROW LEVEL SECURITY;
-- No policies == no anon/auth access. Service role (server) bypasses RLS.
