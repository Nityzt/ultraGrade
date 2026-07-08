import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 *
 * This bypasses RLS, so it must NEVER be exposed to the browser and is only
 * imported by server routes/jobs. It powers:
 *   - the public ICS feed (look up a user by their ics_token)
 *   - the immigration cache (background revalidation writes)
 *
 * Graceful flag: if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is absent, this
 * returns null and every dependent feature degrades to "not configured" (503)
 * rather than crashing. That keeps the app deployable before the operator has
 * set the key. Cached after first construction.
 */
let cached;

export function getServiceClient() {
  if (cached !== undefined) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn(
      '[supabase] SUPABASE_SERVICE_ROLE_KEY not set — calendar feed and ' +
        'immigration cache are disabled (features degrade gracefully).'
    );
    cached = null;
    return cached;
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Convenience boolean for routes that want to 503 early when unconfigured. */
export function isServiceConfigured() {
  return getServiceClient() !== null;
}
