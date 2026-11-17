export function daysUntil(date, now = new Date()) {
  if (!date) return null;
  return Math.ceil((new Date(`${date}T12:00:00`) - now) / 86400000);
}

/** Derives only actionable, unresolved items for the Home command center. */
export function getNextActions({ tasks = [], courses = [], settings = {}, now = new Date() }) {
  const courseMap = Object.fromEntries(courses.map(course => [course.id, course]));
  const nextTask = tasks
    .filter(task => !task.completed && task.dueDate)
    .sort((a, b) => `${a.dueDate}${a.dueTime || ''}`.localeCompare(`${b.dueDate}${b.dueTime || ''}`))[0];
  const missingOutline = courses.find(course => !course.outlineUploaded);
  const permitDays = settings.studentType === 'international' ? daysUntil(settings.permitExpiryDate, now) : null;
  return [
    permitDays !== null && {
      key: 'permit',
      title: permitDays <= 0 ? 'Review your permit now' : 'Review permit details',
      detail: permitDays <= 0 ? 'The recorded date has passed' : `Recorded expiry in ${permitDays} days`,
      to: '/life?tab=immigration',
    },
    nextTask && {
      key: 'deadline', title: nextTask.title,
      detail: `${courseMap[nextTask.courseId]?.code || 'Personal'} · due ${nextTask.dueDate}`,
      to: '/planner',
    },
    missingOutline && {
      key: 'outline', title: `Import ${missingOutline.code || 'a'} outline`,
      detail: 'Turn syllabus details into tasks and schedule entries', to: '/grades',
    },
    !settings.calendarConnected && {
      key: 'calendar', title: 'Connect your calendar',
      detail: 'Bring events into your daily view when you choose', to: '/connections',
    },
  ].filter(Boolean).slice(0, 4);
}
