import axios from 'axios';

const SECTIONS = {
  'study-permit': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html',
    title: 'Study Permit Requirements',
    preferLive: false,
    fallback: `To study in Canada, most international students need a study permit.

Key Requirements:
• Must be enrolled at a Designated Learning Institution (DLI)
• A study permit is NOT a visa — you may need a separate travel visa or eTA
• Maintain full-time enrollment (some exceptions apply)
• Report any address changes to IRCC

Fees & Processing:
• Study permit fee: CAD $150
• Processing times vary by country — apply well before your program starts
• Apply at ircc.canada.ca before travelling to Canada`
  },
  'work-rights': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work.html',
    title: 'Work While Studying',
    preferLive: false,
    fallback: `On-Campus Work:
• Unlimited hours during academic sessions
• No separate work permit needed
• Must have a valid study permit and be actively enrolled

Off-Campus Work:
• Up to 24 hours/week during academic sessions
• Full-time during scheduled breaks (winter, summer, reading week)
• Requires a Social Insurance Number (SIN)

Co-op & Internships (as of April 1, 2026):
• No co-op work permit required for student work placements
• Must be an integral, credited part of your program

Spouse/Partner Work:
• Spouses of eligible full-time students may qualify for an open work permit`
  },
  'pgwp': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/about.html',
    title: 'Post-Graduation Work Permit (PGWP)',
    preferLive: true,
    fallback: `The PGWP lets you work anywhere in Canada after graduating.

Eligibility:
• Program must be at least 8 months long at an eligible DLI
• Apply within 180 days of receiving your final marks
• As of November 1, 2024: proof of language results required at application
• Programs studied primarily online from outside Canada may not qualify

Duration:
• 8 months to < 2 years program → PGWP valid for same length as program
• 2+ year program → PGWP valid for 3 years

Important:
• You can only ever receive ONE PGWP in your lifetime
• Your study permit must have been valid when you finished your studies`
  },
  'ohip': {
    url: 'https://www.ontario.ca/page/apply-ohip-and-get-health-card',
    title: 'OHIP Health Coverage',
    preferLive: true,
    fallback: `OHIP (Ontario Health Insurance Plan) covers most medically necessary services.

Eligibility:
• International students on a valid study permit are eligible for OHIP
• No waiting period — coverage is immediate if you qualify

Applying at ServiceOntario — bring:
• Valid passport
• Study permit
• Proof of Ontario address (lease, utility bill, bank statement)

While waiting for your health card:
• Keep your confirmation of registration as proof of coverage
• Most universities auto-enroll you in private insurance at the start of term — check your student fees`
  }
};

const cache = new Map();            // section → { data, at, ttl }
const inFlight = new Map();          // section → Promise (dedupes background revalidation)
const TTL_MS = 24 * 60 * 60 * 1000; // live content is good for a day
const NEG_TTL_MS = 10 * 60 * 1000;  // after a failed/thin fetch, serve fallback for 10 min before retrying
const UPSTREAM_TIMEOUT = 7000;      // some gov hosts hang; fail fast rather than stall the request

const NOISE_LINES = new Set([
  'image', 'on this page', 'skip this page navigation',
  'sign in to your account', 'check our current processing times',
  'check your application status', 'most requested', 'page details',
  'feature', 'skip to main content', 'language selection', 'breadcrumb',
  'date modified', 'report a problem on this page',
  'you will not receive a reply', 'thank you for your help',
  'for enquiries, contact us', 'government of canada',
  'explore immigration programs', 'answer a few questions to see different ways you might be able to come to canada'
]);

function isNoiseLine(line) {
  const text = line.startsWith('• ') ? line.slice(2) : line;
  return NOISE_LINES.has(text.toLowerCase().trim());
}

function extractMainContent(html) {
  let text = html;

  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) text = mainMatch[1];

  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, inner) => {
    const content = inner.replace(/<[^>]+>/g, '').trim();
    return content ? `\n\n${content}\n` : '';
  });
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
    const content = inner.replace(/<[^>]+>/g, '').trim();
    return content ? `\n• ${content}` : '';
  });
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => {
    const content = inner.replace(/<[^>]+>/g, '').trim();
    return content ? `\n${content}\n` : '';
  });
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');

  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#8209;/g, '-')
    .replace(/&#[0-9]+;/g, (m) => {
      const code = parseInt(m.slice(2, -1));
      return code < 32 || code === 160 ? ' ' : String.fromCharCode(code);
    });

  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.split('\n').map(l => l.trim()).join('\n');
  text = text.split('\n').filter(line => !isNoiseLine(line)).join('\n');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text.slice(0, 5000);
}

const MIN_USEFUL_LENGTH = 400;

function fallbackResult(config) {
  return {
    title: config.title,
    content: config.fallback,
    sourceUrl: config.url,
    fetchedAt: new Date().toISOString(),
    fromFallback: true,
    fromCache: false,
  };
}

/** Hit the upstream page, extract usable content, and cache the outcome. */
async function revalidate(section, config) {
  try {
    const response = await axios.get(config.url, {
      timeout: UPSTREAM_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ultraGrade/1.0; educational use)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-CA,en;q=0.9',
      },
    });

    const liveContent = extractMainContent(response.data);
    const useLive = liveContent.length >= MIN_USEFUL_LENGTH;
    const result = {
      title: config.title,
      content: useLive ? liveContent : config.fallback,
      sourceUrl: config.url,
      fetchedAt: new Date().toISOString(),
      fromFallback: !useLive,
    };
    cache.set(section, { data: result, at: Date.now(), ttl: useLive ? TTL_MS : NEG_TTL_MS });
    return { ...result, fromCache: false };
  } catch (err) {
    console.warn(`Failed to fetch ${section}:`, err.message);
    const result = fallbackResult(config);
    // Negative-cache so a dead host isn't hammered on every page load.
    cache.set(section, { data: result, at: Date.now(), ttl: NEG_TTL_MS });
    return result;
  }
}

/** Fire the revalidation once and share the promise across concurrent callers. */
function revalidateInBackground(section, config) {
  if (inFlight.has(section)) return;
  const p = revalidate(section, config)
    .catch(() => {})
    .finally(() => inFlight.delete(section));
  inFlight.set(section, p);
}

/**
 * Return immigration content for a section — designed to never block the user
 * on a slow or unreachable government host.
 *
 * - Sections that always use curated fallback (`preferLive: false`) skip the
 *   network entirely and return instantly.
 * - `force` (the explicit Refresh button) awaits a live fetch.
 * - Otherwise: serve fresh cache, or serve fallback/stale immediately and warm
 *   the cache in the background so the next visit can upgrade to live content.
 */
export async function fetchSection(section, { force = false } = {}) {
  const config = SECTIONS[section];
  if (!config) throw new Error(`Unknown section: ${section}`);

  if (!config.preferLive) return fallbackResult(config);

  if (force) {
    inFlight.delete(section);
    return revalidate(section, config);
  }

  const cached = cache.get(section);
  const fresh = cached && Date.now() - cached.at < cached.ttl;
  if (fresh) return { ...cached.data, fromCache: true };

  revalidateInBackground(section, config);
  return cached ? { ...cached.data, fromCache: true } : fallbackResult(config);
}

export function clearCache(section) {
  if (section) cache.delete(section);
  else cache.clear();
}
