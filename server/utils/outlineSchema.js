import { z } from 'zod';

/**
 * Validation for the untrusted JSON that Gemini returns.
 *
 * The LLM is instructed to follow a contract but can drift — wrong types,
 * out-of-range values, extra keys, or a completely malformed shape. This
 * module is the trust boundary: it coerces what it safely can, drops
 * individual bad array entries rather than failing the whole import, and
 * throws only when the payload is unusable.
 */

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const scheduleItemSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(TIME),
  endTime: z.string().regex(TIME),
  location: z.string().default(''),
  type: z.enum(['lecture', 'lab', 'tutorial']).catch('lecture'),
});

const assessmentSchema = z.object({
  name: z.string().trim().min(1),
  weight: z.coerce.number().min(0).max(100),
});

const deadlineSchema = z.object({
  title: z.string().trim().min(1),
  date: z.string().regex(DATE),
  type: z.enum(['assignment', 'exam', 'quiz', 'project']).catch('assignment'),
});

/** An array field that silently discards entries failing `itemSchema`.
 *  Optional so a missing key normalises to an empty array. */
function lenientArray(itemSchema) {
  return z
    .any()
    .optional()
    .transform((value) => {
      if (!Array.isArray(value)) return [];
      return value.flatMap((item) => {
        const parsed = itemSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      });
    });
}

const optionalText = z.string().trim().optional().catch(undefined);

const outlineSchema = z
  .object({
    courseName: optionalText,
    courseCode: optionalText,
    professor: optionalText,
    creditHours: z.coerce.number().positive().optional().catch(undefined),
    schedule: lenientArray(scheduleItemSchema),
    assessments: lenientArray(assessmentSchema),
    deadlines: lenientArray(deadlineSchema),
  })
  .strip();

/** True when the payload has no course identity and no usable rows. */
function isEmpty(outline) {
  return (
    !outline.courseName &&
    !outline.courseCode &&
    outline.schedule.length === 0 &&
    outline.assessments.length === 0 &&
    outline.deadlines.length === 0
  );
}

function pruneUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/**
 * Validate and normalise raw Gemini output.
 * @param {unknown} raw - JSON parsed from the model response
 * @returns {Object} A clean outline object safe to import
 * @throws {Error} When the payload is not a usable outline
 */
export function validateOutline(raw) {
  const result = outlineSchema.safeParse(raw);
  if (!result.success) {
    throw new Error('Parsed outline did not match the expected structure');
  }
  if (isEmpty(result.data)) {
    throw new Error('No course details could be extracted from this document');
  }
  return pruneUndefined(result.data);
}
