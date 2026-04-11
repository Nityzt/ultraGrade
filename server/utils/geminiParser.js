import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Upgrade model here: change 'gemini-2.0-flash-lite' to 'gemini-1.5-pro' for better accuracy
const MODEL = 'gemini-2.0-flash-lite';

const SYSTEM_PROMPT = `You are parsing a university course outline (syllabus).
Extract and return ONLY valid JSON with these fields:
- courseName (string)
- courseCode (string, e.g. "EECS 3311")
- professor (string)
- creditHours (number)
- schedule (array of { dayOfWeek: 0-6, startTime: "HH:MM", endTime: "HH:MM", location: string, type: "lecture"|"lab"|"tutorial" })
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

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
}
