import axios from 'axios';

const SECTIONS = {
  'study-permit': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html',
    title: 'Study Permit Requirements',
    fallback: `Study Permit Requirements

To study in Canada, most international students need a study permit.

Key Requirements:
• You must be enrolled at a Designated Learning Institution (DLI)
• Your study permit is NOT a visa — you may need a separate travel visa or eTA
• Maintain full-time enrollment (some exceptions apply)
• Report any address changes to IRCC

Processing:
• Apply at IRCC.gc.ca before your program begins
• Processing times vary by country
• Study permit fee: CAD $150

For the latest information, visit canada.ca/study-canada`
  },
  'work-rights': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work.html',
    title: 'Work While Studying',
    fallback: `Work Rights for International Students

On-Campus Work:
• Unlimited hours during academic sessions
• No separate work permit needed
• Must have a valid study permit

Off-Campus Work:
• Up to 24 hours/week during academic sessions
• Full-time during scheduled breaks (winter, summer, reading week)
• Need a SIN (Social Insurance Number) to work legally

Co-op/Internship:
• Requires a Co-op Work Permit in addition to your study permit
• Must be an integral part of your program

For the latest rules, visit canada.ca/study-canada/work`
  },
  'pgwp': {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/about.html',
    title: 'Post-Graduation Work Permit (PGWP)',
    fallback: `Post-Graduation Work Permit (PGWP)

The PGWP allows you to work in Canada after graduating.

Eligibility:
• Program must be at least 8 months long at a Designated Learning Institution (DLI)
• Apply within 180 days of receiving your final grades
• Programs studied primarily online from outside Canada may not qualify

Duration:
• 8 months to < 2 years program → PGWP valid for same length as program
• 2+ year program → PGWP valid for 3 years

Important:
• You can only ever receive ONE PGWP in your lifetime
• Your study permit must have been valid when you finished your studies

For the latest information, visit canada.ca/pgwp`
  },
  'ohip': {
    url: 'https://www.ontario.ca/page/apply-ohip-and-get-health-card',
    title: 'OHIP Health Coverage',
    fallback: `OHIP Health Coverage

OHIP (Ontario Health Insurance Plan) covers most medically necessary services.

Eligibility for International Students:
• International students on a valid study permit ARE eligible for OHIP
• There is a 3-month waiting period before coverage begins

What to Bring When Applying at ServiceOntario:
• Valid passport
• Study permit
• Proof of Ontario address (lease, utility bill)

During the Waiting Period:
• Purchase private health insurance through your school's student union
• Most universities offer this automatically with enrollment

For the latest information, visit ontario.ca/ohip`
  }
};

const cache = new Map();
const TTL_MS = 24 * 60 * 60 * 1000;

function extractMainContent(html) {
  let text = html;

  // Extract <main> content only
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) text = mainMatch[1];

  // Strip unwanted blocks entirely
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Convert structural elements to readable text
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

  // Strip all remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Normalize line endings, trim each line, collapse blanks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.split('\n').map(l => l.trim()).join('\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text.slice(0, 5000);
}

const MIN_USEFUL_LENGTH = 200;

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

    // If the live content is too sparse (JS-rendered site), use the fallback text
    const useContent = content.length >= MIN_USEFUL_LENGTH ? content : config.fallback;
    const fromFallback = content.length < MIN_USEFUL_LENGTH;

    const result = {
      title: config.title,
      content: useContent,
      sourceUrl: config.url,
      fetchedAt: new Date().toISOString(),
      fromFallback
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
