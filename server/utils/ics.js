/**
 * Minimal RFC 5545 iCalendar builder for the ultraGrade deadline feed.
 *
 * Emits floating-local date-times (no TZID / no Z suffix) so a deadline shows at
 * the same wall-clock time in whatever calendar subscribes — deadlines are
 * inherently local and this avoids shipping a VTIMEZONE block.
 *
 * Pure and dependency-free so it can be unit-tested without a DB or network.
 */

/** Escape a text value per RFC 5545 §3.3.11. */
function escapeText(v) {
  return String(v ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line to <=75 octets with CRLF + space continuation. */
function fold(line) {
  if (line.length <= 75) return line;
  const chunks = [];
  let s = line;
  chunks.push(s.slice(0, 75));
  s = s.slice(75);
  while (s.length > 74) {
    chunks.push(' ' + s.slice(0, 74));
    s = s.slice(74);
  }
  if (s.length) chunks.push(' ' + s);
  return chunks.join('\r\n');
}

/** "2026-07-10" -> "20260710"; returns null if not a valid ISO date. */
function toDateStamp(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr.replace(/-/g, '') : null;
}

/** "23:59" -> "235900"; defaults seconds to 00. */
function toTimeStamp(timeStr) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(timeStr || '')
    ? timeStr.replace(':', '').padStart(4, '0') + '00'
    : null;
}

/** A UTC DTSTAMP for "now" (generation time). */
function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Build a VCALENDAR from tasks.
 * @param {Object} opts
 * @param {string} opts.calendarName - X-WR-CALNAME
 * @param {Array} opts.tasks - [{ id, title, dueDate, dueTime, description, courseCode }]
 * @param {Date}  opts.now - generation timestamp (injected for deterministic tests)
 * @returns {string} ICS document with CRLF line endings
 */
export function buildIcs({ calendarName = 'ultraGrade', tasks = [], now = new Date() }) {
  const dtstamp = utcStamp(now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ultraGrade//Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'X-WR-TIMEZONE:America/Toronto',
  ];

  for (const t of tasks) {
    const date = toDateStamp(t.dueDate);
    if (!date) continue; // undated tasks can't be calendar events

    const summary = t.courseCode ? `${t.courseCode}: ${t.title}` : t.title || 'Task';
    const time = toTimeStamp(t.dueTime);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${escapeText(t.id)}@ultragrade`);
    lines.push(`DTSTAMP:${dtstamp}`);
    if (time) {
      lines.push(`DTSTART:${date}T${time}`);
      // 30-minute default block for a timed deadline.
      lines.push(`DTEND:${date}T${time}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${date}`);
    }
    lines.push(fold(`SUMMARY:${escapeText(summary)}`));
    if (t.description) lines.push(fold(`DESCRIPTION:${escapeText(t.description)}`));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
