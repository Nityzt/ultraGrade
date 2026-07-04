import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateOutline } from './outlineSchema.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.0-flash (and -lite) now report free-tier limit: 0 — use 2.5-flash.
const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are parsing a university course outline (syllabus).
Extract and return ONLY valid JSON with these fields:
- courseName (string)
- courseCode (string, e.g. "EECS 3311")
- professor (string)
- creditHours (number)
- schedule (array of { dayOfWeek, startTime: "HH:MM" 24-hour, endTime: "HH:MM" 24-hour, location: string, type: "lecture"|"lab"|"tutorial" })
  dayOfWeek is a number where 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- assessments (array of { name: string, weight: integer } — weights should sum to 100)
- deadlines (array of { title: string, date: "YYYY-MM-DD", type: "assignment"|"exam"|"quiz"|"project" })

If a field cannot be determined from the document, omit it entirely.
Return ONLY valid JSON — no explanation, no markdown fences, no extra text.`;

/**
 * Parse a course outline using Gemini.
 * @param {string|null} text - Extracted text content (for PDFs)
 * @param {string|null} imageBase64 - Base64 encoded image (for image files)
 * @param {string|null} mimeType - MIME type of the image (e.g. "image/jpeg")
 * @returns {Promise<Object>} Parsed course outline JSON
 */
export async function parseOutlineWithGemini(text, imageBase64, mimeType) {
  const model = genAI.getGenerativeModel({ model: MODEL });

  let result;

  if (imageBase64 && mimeType) {
    // Vision mode: image input
    result = await model.generateContent([
      SYSTEM_PROMPT,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ]);
  } else if (text) {
    // Text mode: extracted PDF text
    result = await model.generateContent(`${SYSTEM_PROMPT}\n\nCOURSE OUTLINE TEXT:\n${text}`);
  } else {
    throw new Error('No content provided — supply either text or imageBase64');
  }

  const raw = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps in them
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  return validateOutline(parsed);
}
