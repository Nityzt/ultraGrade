import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { generateWithRetry } from './geminiParser.js';
import { validateQuickAdd } from './quickAddSchema.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = 'gemini-2.5-flash'; // 2.0-flash reports free-tier limit: 0 — see CLAUDE.md §11

// Flat structured-output schema covering all three kinds; the client keeps only
// the fields relevant to `kind` when it commits.
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    kind: { type: SchemaType.STRING, enum: ['task', 'grade', 'class'], format: 'enum' },
    courseId: { type: SchemaType.STRING },
    // task
    title: { type: SchemaType.STRING },
    taskType: { type: SchemaType.STRING, enum: ['assignment', 'exam', 'quiz', 'project', 'personal'], format: 'enum' },
    dueDate: { type: SchemaType.STRING },
    dueTime: { type: SchemaType.STRING },
    priority: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'], format: 'enum' },
    // grade
    category: { type: SchemaType.STRING },
    label: { type: SchemaType.STRING },
    score: { type: SchemaType.NUMBER },
    maxScore: { type: SchemaType.NUMBER },
    // class
    dayOfWeek: { type: SchemaType.INTEGER },
    startTime: { type: SchemaType.STRING },
    endTime: { type: SchemaType.STRING },
    location: { type: SchemaType.STRING },
    classType: { type: SchemaType.STRING, enum: ['lecture', 'lab', 'tutorial'], format: 'enum' },
  },
  required: ['kind'],
};

function buildPrompt({ courses, currentDate }) {
  const courseLines = (courses || [])
    .map((c) => `  - id="${c.id}" code="${c.code || ''}" name="${c.name || ''}"`)
    .join('\n') || '  (none)';

  return `You convert one short natural-language note from a student into a single structured item for their planner.

Today's date is ${currentDate} (use it to resolve relative dates like "tomorrow", "next friday", "in 2 weeks").

Classify the note into exactly one "kind":
- "task": an assignment, exam, quiz, project, or personal to-do with a deadline. Fill: title, taskType, dueDate (YYYY-MM-DD), dueTime (HH:MM, 24h; default "23:59" if only a day is given), priority.
- "grade": a mark the student received. Fill: category (the assessment category name, e.g. "Midterm", "Assignment 1"), label, score (number), maxScore (number). "got 85%" → score 85, maxScore 100. "18/20" → score 18, maxScore 20.
- "class": a recurring class meeting. Fill: dayOfWeek (INTEGER 0=Sunday … 6=Saturday), startTime, endTime (HH:MM 24h), location, classType (lecture/lab/tutorial).

COURSE MATCHING — the student's courses are listed below. If the note references one (by code like "cs350"/"eecs 3311" or by name), set courseId to that course's EXACT id from the list. If no course clearly matches, set courseId to "".
Courses:
${courseLines}

Rules:
- Return the single best interpretation. Prefer "task" when a deadline is implied.
- Only emit a dueDate you can justify from the note + today's date; if no date is stated or implied, omit it.
- Do not invent a courseId that is not in the list above.

NOTE:
`;
}

/**
 * Parse one natural-language quick-add note.
 * @param {string} text - The raw note (e.g. "lab report due next fri 20%")
 * @param {Object} context
 * @param {Array<{id:string,code:string,name:string}>} context.courses
 * @param {string} context.currentDate - YYYY-MM-DD
 * @returns {Promise<Object>} validated quick-add item
 */
export async function parseQuickAdd(text, context = {}) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const prompt = buildPrompt(context);
  const result = await generateWithRetry(model, `${prompt}${text}`);
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  const knownIds = (context.courses || []).map((c) => c.id);
  return validateQuickAdd(parsed, knownIds);
}
