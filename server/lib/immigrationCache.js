import { getServiceClient } from './supabase.js';

/**
 * Persistent immigration-content cache backed by Supabase (`immigration_cache`).
 *
 * Render's free web instance spins down and loses its in-memory cache, and
 * canada.ca is often unreachable from that egress. So a background cron job
 * (server/jobs/revalidateImmigration.js) fetches the gov pages and writes the
 * results here; the web process hydrates its in-memory cache from this table so
 * live content survives restarts and slow/blocked upstreams.
 *
 * All functions no-op / return null when the service-role client isn't
 * configured, so the feature degrades to the curated fallback with zero errors.
 */

export async function readCachedSection(section) {
  const supabase = getServiceClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('immigration_cache')
      .select('section, title, content, source_url, fetched_at')
      .eq('section', section)
      .maybeSingle();
    if (error || !data) return null;
    return {
      title: data.title,
      content: data.content,
      sourceUrl: data.source_url,
      fetchedAt: data.fetched_at,
    };
  } catch (err) {
    console.warn(`[immigrationCache] read ${section} failed:`, err.message);
    return null;
  }
}

export async function writeCachedSection(section, { title, content, sourceUrl, fetchedAt }) {
  const supabase = getServiceClient();
  if (!supabase) return { skipped: true };
  try {
    const { error } = await supabase.from('immigration_cache').upsert(
      {
        section,
        title,
        content,
        source_url: sourceUrl,
        fetched_at: fetchedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'section' }
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn(`[immigrationCache] write ${section} failed:`, err.message);
    return { error: err };
  }
}
