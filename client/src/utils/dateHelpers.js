// Date helper utilities

export function toDateStr(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  // Date-only application values are calendar dates, not UTC instants. Using
  // toISOString() turns late-evening Toronto (and other negative offsets) into
  // tomorrow. Read the local calendar fields instead.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Infer start/end dates from a semester name like "Fall 2022".
 *   Fall/Autumn → Sep 1 – Dec 31
 *   Winter      → Jan 1 – Apr 30
 *   Spring/Summer → May 1 – Aug 31
 * Returns { startDate, endDate } (YYYY-MM-DD) or null when term/year is unclear.
 */
export function inferSemesterDates(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  const yearMatch = lower.match(/\b(20\d{2})\b/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[1], 10);

  let term = null;
  if (/\b(fall|autumn)\b/.test(lower)) term = 'fall';
  else if (/\bwinter\b/.test(lower)) term = 'winter';
  else if (/\bspring\b/.test(lower)) term = 'spring';
  else if (/\bsummer\b/.test(lower)) term = 'summer';
  if (!term) return null;

  const ranges = {
    fall:   [`${year}-09-01`, `${year}-12-31`],
    winter: [`${year}-01-01`, `${year}-04-30`],
    spring: [`${year}-05-01`, `${year}-08-31`],
    summer: [`${year}-05-01`, `${year}-08-31`],
  };
  const [startDate, endDate] = ranges[term];
  return { startDate, endDate };
}

export function today() {
  return toDateStr(new Date());
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime()) || !Number.isFinite(Number(days))) return '';
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function daysBetween(dateStrA, dateStrB) {
  // UTC midnight gives exact calendar-day arithmetic across DST boundaries.
  const a = Date.parse(`${dateStrA}T00:00:00Z`);
  const b = Date.parse(`${dateStrB}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function getUrgency(task) {
  if (task.completed) return 'done';
  const diff = daysBetween(today(), task.dueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 1) return 'critical';
  if (diff <= (task.reminderDays || 3)) return 'soon';
  if (diff <= 7) return 'upcoming';
  return 'later';
}

/**
 * Soonest date >= fromDate whose weekday matches dayOfWeek (0=Sun…6=Sat),
 * as YYYY-MM-DD. Returns fromDate's own date when it already matches.
 */
export function nextOccurrenceOfDay(dayOfWeek, fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setHours(12, 0, 0, 0); // noon: keeps toDateStr's UTC split on the local date
  d.setDate(d.getDate() + ((dayOfWeek - d.getDay() + 7) % 7));
  return toDateStr(d);
}

export function urgencyLabel(urgency) {
  const labels = { overdue: 'Overdue', today: 'Today', critical: 'Tomorrow', soon: 'Soon', upcoming: 'This Week', later: 'Later', done: 'Done' };
  return labels[urgency] || 'Later';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '';
  const base = formatDate(dateStr);
  if (!timeStr) return base;
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${base} ${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Generate a 6-week calendar grid for a given year/month
export function generateCalendarMonth(year, month, tasks = []) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from Monday of the first week
  let startDate = new Date(firstDay);
  const dow = firstDay.getDay(); // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  startDate.setDate(startDate.getDate() + offset);

  const tasksByDate = {};
  for (const task of tasks) {
    if (!tasksByDate[task.dueDate]) tasksByDate[task.dueDate] = [];
    tasksByDate[task.dueDate].push(task);
  }

  const weeks = [];
  let current = new Date(startDate);

  for (let week = 0; week < 6; week++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateStr(current);
      days.push({
        date: dateStr,
        day: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: dateStr === today(),
        tasks: tasksByDate[dateStr] || []
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(days);
    if (current > lastDay && week >= 3) break;
  }

  return weeks;
}

export function dayName(dayOfWeek) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
}

export function dayFullName(dayOfWeek) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}

export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
