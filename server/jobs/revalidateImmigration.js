import 'dotenv/config';
import { fetchSection, LIVE_SECTIONS } from '../utils/immigrationFetcher.js';
import { isServiceConfigured } from '../lib/supabase.js';

/**
 * Background revalidation job for immigration content — run by a Render Cron Job
 * (see render.yaml), NOT on the request path.
 *
 * For each live section it forces a direct fetch of the gov page; on success
 * `fetchSection` persists the content to the Supabase `immigration_cache` table
 * (via the service-role client) so the web instance can hydrate from it. Render's
 * cron egress can often reach canada.ca where the browser/local dev cannot.
 *
 * Exits 0 even on partial failure — a dead upstream is expected and simply leaves
 * the previous cached (or curated fallback) content in place.
 */
async function main() {
  if (!isServiceConfigured()) {
    console.error('[revalidate] SUPABASE_SERVICE_ROLE_KEY not set — nothing to persist. Exiting.');
    process.exit(0);
  }

  console.log(`[revalidate] refreshing ${LIVE_SECTIONS.length} sections: ${LIVE_SECTIONS.join(', ')}`);

  for (const section of LIVE_SECTIONS) {
    try {
      const r = await fetchSection(section, { force: true });
      const state = r.fromFallback ? 'FALLBACK (upstream thin/unreachable)' : 'LIVE (persisted)';
      console.log(`[revalidate] ${section}: ${state} · ${r.content.length} chars`);
    } catch (err) {
      console.warn(`[revalidate] ${section}: error — ${err.message}`);
    }
  }

  console.log('[revalidate] done.');
  process.exit(0);
}

main();
