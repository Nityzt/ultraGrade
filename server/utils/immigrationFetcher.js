import axios from 'axios';

const SECTIONS = {
  'study-permit': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html',
    title: 'Study Permit Requirements',
    fallback: `Study Permit Requirements (Offline Fallback)

To study in Canada, most international students need a study permit.

Key Requirements:
• You must be enrolled at a Designated Learning Institution (DLI)
• You must maintain full-time enrollment (some exceptions apply)
• Your study permit is NOT a visa — you may need a separate travel visa or eTA
• Report any address changes to IRCC
• You cannot work off-campus without a valid SIN and proper authorization

Apply for your study permit at IRCC.gc.ca before your program begins. Processing times vary.

For the latest information, visit: canada.ca/study-canada`
  },
  'work-rights': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work.html',
    title: 'Work While Studying',
    fallback: `Work Rights for International Students (Offline Fallback)

On-Campus Work:
• Unlimited hours during academic sessions
• No separate work permit needed
• Must have a valid study permit

Off-Campus Work:
• Up to 20 hours/week during academic sessions (increased from previous 20h limit — verify current rules at IRCC.gc.ca)
• Full-time during scheduled breaks (winter break, summer, reading week)
• Need a SIN (Social Insurance Number) to work legally

Co-op/Internship:
• Requires a Co-op Work Permit in addition to your study permit
• Must be an integral part of your program

For the latest information, visit: canada.ca/study-canada/work`
  },
  'pgwp': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/about.html',
    title: 'Post-Graduation Work Permit (PGWP)',
    fallback: `Post-Graduation Work Permit (PGWP) (Offline Fallback)

The PGWP allows you to work in Canada after graduating.

Eligibility:
• Your program must be at least 8 months long
• You must have studied at a Designated Learning Institution (DLI)
• You must apply within 180 days of receiving your final grades
• Programs studied primarily online from outside Canada may not qualify

Duration:
• Programs 8 months to less than 2 years: PGWP valid for same length as program
• Programs 2 years or more: PGWP valid for 3 years

Important: You can only ever get ONE PGWP in your lifetime.

For the latest information, visit: canada.ca/pgwp`
  },
  'ohip': {
    url: 'https://www.ontario.ca/page/apply-ohip-and-get-health-card',
    title: 'OHIP Health Coverage',
    fallback: `OHIP Health Coverage (Offline Fallback)

OHIP (Ontario Health Insurance Plan) covers most medically necessary services.

Eligibility for International Students:
• You must be a Canadian citizen, permanent resident, or hold certain immigration status
• International students on a study permit ARE eligible for OHIP
• There is a 3-month waiting period before coverage begins

What to Bring When Applying at ServiceOntario:
• Valid passport
• Study permit
• Proof of Ontario address (lease, utility bill)

Coverage starts approximately 3 months after your arrival in Ontario.

During the waiting period, purchase private health insurance through your school's student union.

For the latest information, visit: ontario.ca/ohip`
  }
};

const cache = new Map();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function extractMainContent(html) {
  // Try to find main content area
  let text = html;

  // Extract content between <main> tags
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) text = mainMatch[1];

  // Remove script and style tags
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Convert headings to text with markers
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n## $1\n');
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n• $1');
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();

  return text.slice(0, 6000);
}

export async function fetchSection(section) {
  const config = SECTIONS[section];
  if (!config) throw new Error(`Unknown section: ${section}`);

  const cached = cache.get(section);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return { ...cached, fromCache: true };
  }

  try {
    const response = await axios.get(config.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ultraGrade/1.0; educational use)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-CA,en;q=0.9'
      }
    });

    const content = extractMainContent(response.data);
    const result = {
      title: config.title,
      content,
      sourceUrl: config.url,
      fetchedAt: new Date().toISOString(),
      fromFallback: false
    };

    cache.set(section, { ...result, fetchedAt: Date.now() });
    return { ...result, fromCache: false };
  } catch (err) {
    console.warn(`Failed to fetch ${section}:`, err.message);
    return {
      title: config.title,
      content: config.fallback,
      sourceUrl: config.url,
      fetchedAt: new Date().toISOString(),
      fromFallback: true,
      fromCache: false,
      error: err.message
    };
  }
}

export function clearCache(section) {
  if (section) cache.delete(section);
  else cache.clear();
}
