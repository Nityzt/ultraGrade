import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { validateOutline } from './outlineSchema.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.0-flash (and -lite) now report free-tier limit: 0 — use 2.5-flash.
const MODEL = 'gemini-2.5-flash';

// Structured-output schema: forcing responseMimeType=application/json + this
// schema makes Gemini return well-formed JSON in the exact shape we expect, so
// we no longer depend on it "remembering" to avoid prose or markdown fences.
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    courseName: { type: SchemaType.STRING },
    courseCode: { type: SchemaType.STRING },
    professor: { type: SchemaType.STRING },
    creditHours: { type: SchemaType.NUMBER },
    schedule: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dayOfWeek: { type: SchemaType.INTEGER },
          startTime: { type: SchemaType.STRING },
          endTime: { type: SchemaType.STRING },
          location: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
        },
        required: ['dayOfWeek', 'startTime', 'endTime'],
      },
    },
    assessments: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          weight: { type: SchemaType.NUMBER },
        },
        required: ['name', 'weight'],
      },
    },
    deadlines: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
        },
        required: ['title', 'date'],
      },
    },
  },
  required: ['courseName', 'courseCode'],
};

function buildPrompt(context) {
  const { semesterName, semesterStart, semesterEnd, currentYear } = context || {};
  const semLine = semesterStart || semesterEnd
    ? `\nSEMESTER CONTEXT: This outline is for "${semesterName || 'the current term'}", which runs ${semesterStart || '(unknown start)'} to ${semesterEnd || '(unknown end)'}.`
    : `\nSEMESTER CONTEXT: The current year is ${currentYear}.`;

  return `You are parsing a university course outline (syllabus). Extract structured data.

Fields:
- courseName: full course title.
- courseCode: e.g. "EECS 3311".
- professor: primary instructor's name only (no title honorifics if avoidable).
- creditHours: numeric credit value (default to 3 only if truly unspecified).
- schedule: every recurring class meeting. dayOfWeek is an INTEGER where 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday. Times are 24-hour "HH:MM". type is one of "lecture", "lab", "tutorial". Include lectures, labs AND tutorials as separate entries.
- assessments: every graded component with its weight as a number out of 100 (e.g. Midterm 30). Weights should sum to ~100.
- deadlines: specific dated items (assignments, quizzes, midterms, exams, project milestones). type is one of "assignment", "exam", "quiz", "project".

CRITICAL — dates:
- Every deadline's "date" MUST be an absolute calendar date in "YYYY-MM-DD" format.
- Resolve relative references ("Week 5", "the third Friday", "Oct 12", "end of term") to absolute dates using the semester context below. Assume the year from the semester dates.
- If an assessment has a weight but no determinable date, still include it in "assessments"; only add it to "deadlines" when you can assign a real date.
- Do NOT invent dates you cannot justify from the document. Omit undated deadlines rather than guessing.
${semLine}

Extract as much as the document supports. Prefer more complete schedule and deadline lists over brevity.`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Gemini's flash tier throws transient 503 "high demand" / UNAVAILABLE spikes.
// Retry those a couple of times with backoff; never retry quota (429) — it
// won't clear in seconds and we surface a clearer message for it upstream.
function isTransient(err) {
  const m = (err?.message || '').toLowerCase();
  return m.includes('503') || m.includes('unavailable') || m.includes('overloaded') || m.includes('high demand');
}

async function generateWithRetry(model, request, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await model.generateContent(request);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      await sleep(600 * (i + 1)); // 600ms, 1200ms
    }
  }
  throw lastErr;
}

/**
 * Parse a course outline using Gemini.
 * @param {string|null} text - Extracted text content (for PDFs)
 * @param {string|null} imageBase64 - Base64 encoded image (for image files)
 * @param {string|null} mimeType - MIME type of the image (e.g. "image/jpeg")
 * @param {Object} [context] - Semester context to resolve relative dates
 * @returns {Promise<Object>} Parsed course outline JSON
 */
export async function parseOutlineWithGemini(text, imageBase64, mimeType, context = {}) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const prompt = buildPrompt(context);
  let result;

  if (imageBase64 && mimeType) {
    result = await generateWithRetry(model, [
      prompt,
      { inlineData: { data: imageBase64, mimeType } },
    ]);
  } else if (text) {
    result = await generateWithRetry(model, `${prompt}\n\nCOURSE OUTLINE TEXT:\n${text}`);
  } else {
    throw new Error('No content provided — supply either text or imageBase64');
  }

  const raw = result.response.text().trim();

  // Structured output is already pure JSON, but strip fences defensively.
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  return validateOutline(parsed);
}
