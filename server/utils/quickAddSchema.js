import { z } from 'zod';

/**
 * Validation for the untrusted JSON that Gemini returns for a natural-language
 * quick-add ("lab report due next fri, 20%" → structured task/grade/class).
 *
 * Like outlineSchema.js this is the trust boundary: coerce what we safely can,
 * normalise blanks to undefined, and throw only when the payload is unusable.
 * The result is discriminated by `kind`; irrelevant fields for a given kind are
 * simply pruned by the client when it commits.
 */

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = z
  .string()
  .trim()
  .optional()
  .catch(undefined)
  .transform((v) => (v ? v : undefined));

const optionalDate = z
  .string()
  .trim()
  .regex(DATE)
  .optional()
  .catch(undefined);

const optionalTime = z
  .string()
  .trim()
  .regex(TIME)
  .optional()
  .catch(undefined);

const quickAddSchema = z
  .object({
    kind: z.enum(['task', 'grade', 'class']),

    // Resolved course — Gemini is given the user's courses and echoes the
    // matching id (or ""). We re-validate it against the known ids in the route
    // so a hallucinated id can never slip through.
    courseId: optionalText,

    // task
    title: optionalText,
    taskType: z.enum(['assignment', 'exam', 'quiz', 'project', 'personal']).catch('assignment'),
    dueDate: optionalDate,
    dueTime: optionalTime,
    priority: z.enum(['low', 'medium', 'high']).catch('medium'),

    // grade
    category: optionalText,
    label: optionalText,
    score: z.coerce.number().min(0).optional().catch(undefined),
    maxScore: z.coerce.number().positive().optional().catch(undefined),

    // class
    dayOfWeek: z.coerce.number().int().min(0).max(6).optional().catch(undefined),
    startTime: optionalTime,
    endTime: optionalTime,
    location: optionalText,
    classType: z.enum(['lecture', 'lab', 'tutorial']).catch('lecture'),
  })
  .strip();

function pruneUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** True when the parsed item has no actionable content for its kind. */
function isUnusable(d) {
  if (d.kind === 'task') return !d.title;
  if (d.kind === 'grade') return d.score === undefined || d.maxScore === undefined;
  if (d.kind === 'class') return d.dayOfWeek === undefined || !d.startTime || !d.endTime;
  return true;
}

/**
 * Validate + normalise raw Gemini quick-add output.
 * @param {unknown} raw - JSON parsed from the model response
 * @param {string[]} [knownCourseIds] - ids the model was allowed to reference
 * @returns {Object} A clean, committable quick-add object
 * @throws {Error} When the payload is not usable
 */
export function validateQuickAdd(raw, knownCourseIds = []) {
  const result = quickAddSchema.safeParse(raw);
  if (!result.success) {
    throw new Error('Could not understand that — try rephrasing with a bit more detail.');
  }
  const data = result.data;

  // Drop a courseId the model invented (or one no longer in the user's list).
  if (data.courseId && !knownCourseIds.includes(data.courseId)) {
    data.courseId = undefined;
  }

  if (isUnusable(data)) {
    throw new Error('Not enough detail to add that. Include a title, a grade, or a day + time.');
  }

  return pruneUndefined(data);
}
