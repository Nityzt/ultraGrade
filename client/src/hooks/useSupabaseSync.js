import { supabase } from '../lib/supabase.js';

// ── Semesters ──────────────────────────────────────────────────────────────
export function insertSemester(sem, userId) {
  return supabase.from('semesters').insert({
    id: sem.id,
    user_id: userId,
    name: sem.name || '',
    start_date: sem.startDate || '',
    end_date: sem.endDate || '',
    is_active: sem.isActive || false,
  });
}

export function updateSemester(id, data, userId) {
  const row = {};
  if ('name' in data)      row.name       = data.name;
  if ('startDate' in data) row.start_date = data.startDate;
  if ('endDate' in data)   row.end_date   = data.endDate;
  if ('isActive' in data)  row.is_active  = data.isActive;
  if (!Object.keys(row).length) return Promise.resolve({ error: null });
  return supabase.from('semesters').update(row).eq('id', id).eq('user_id', userId);
}

export function deleteSemester(id, userId) {
  return supabase.from('semesters').delete().eq('id', id).eq('user_id', userId);
}

// ── Courses ────────────────────────────────────────────────────────────────
export async function insertCourse(course, userId) {
  const { error } = await supabase.from('courses').insert({
    id: course.id,
    user_id: userId,
    semester_id: course.semesterId,
    code: course.code || '',
    name: course.name || '',
    professor: course.professor || '',
    credit_hours: course.creditHours ?? 3,
    target_grade: course.targetGrade ?? 70,
    color: course.color || '#4ade80',
    notes: course.notes || '',
    outline_uploaded: course.outlineUploaded || false,
    final_grade_override: course.finalGradeOverride ?? null,
  });
  if (error) return { error };

  // Insert categories (and their grades) if bundled in with the course
  const categories = course.categories || [];
  if (categories.length) {
    const catRows = categories.map((cat, i) => ({
      id: cat.id,
      user_id: userId,
      course_id: course.id,
      name: cat.name || '',
      weight: cat.weight ?? 0,
      drop_lowest: cat.dropLowest || false,
      position: i,
    }));
    const { error: catErr } = await supabase.from('categories').insert(catRows);
    if (catErr) return { error: catErr };

    for (const cat of categories) {
      const grades = cat.grades || [];
      if (grades.length) {
        const gradeRows = grades.map(g => ({
          id: g.id,
          user_id: userId,
          category_id: cat.id,
          label: g.label || '',
          score: g.score ?? 0,
          max_score: g.maxScore ?? 100,
          weight: g.weight ?? 1,
          date: g.date || '',
        }));
        const { error: grErr } = await supabase.from('grades').insert(gradeRows);
        if (grErr) return { error: grErr };
      }
    }
  }

  return { error: null };
}

export function updateCourse(id, data, userId) {
  const row = {};
  if ('code' in data)               row.code                 = data.code;
  if ('name' in data)               row.name                 = data.name;
  if ('professor' in data)          row.professor            = data.professor;
  if ('creditHours' in data)        row.credit_hours         = data.creditHours;
  if ('targetGrade' in data)        row.target_grade         = data.targetGrade;
  if ('color' in data)              row.color                = data.color;
  if ('notes' in data)              row.notes                = data.notes;
  if ('outlineUploaded' in data)    row.outline_uploaded     = data.outlineUploaded;
  if ('finalGradeOverride' in data) row.final_grade_override = data.finalGradeOverride;
  if (!Object.keys(row).length) return Promise.resolve({ error: null });
  return supabase.from('courses').update(row).eq('id', id).eq('user_id', userId);
}

export async function deleteCourse(id, userId) {
  await Promise.all([
    supabase.from('tasks').delete().eq('course_id', id).eq('user_id', userId),
    supabase.from('timetable_entries').delete().eq('course_id', id).eq('user_id', userId),
    supabase.from('study_hours').delete().eq('course_id', id).eq('user_id', userId),
    supabase.from('categories').delete().eq('course_id', id).eq('user_id', userId),
  ]);
  return supabase.from('courses').delete().eq('id', id).eq('user_id', userId);
}

// ── Categories ────────────────────────────────────────────────────────────
export function insertCategory(courseId, cat, position, userId) {
  return supabase.from('categories').insert({
    id: cat.id,
    user_id: userId,
    course_id: courseId,
    name: cat.name || '',
    weight: cat.weight ?? 0,
    drop_lowest: cat.dropLowest || false,
    position,
  });
}

export function updateCategory(catId, data, userId) {
  const row = {};
  if ('name' in data)       row.name        = data.name;
  if ('weight' in data)     row.weight      = data.weight;
  if ('dropLowest' in data) row.drop_lowest = data.dropLowest;
  if ('position' in data)   row.position    = data.position;
  if (!Object.keys(row).length) return Promise.resolve({ error: null });
  return supabase.from('categories').update(row).eq('id', catId).eq('user_id', userId);
}

export function deleteCategory(catId, userId) {
  return supabase.from('categories').delete().eq('id', catId).eq('user_id', userId);
}

// ── Grades ────────────────────────────────────────────────────────────────
export function insertGrade(catId, grade, userId) {
  return supabase.from('grades').insert({
    id: grade.id,
    user_id: userId,
    category_id: catId,
    label: grade.label || '',
    score: grade.score ?? 0,
    max_score: grade.maxScore ?? 100,
    weight: grade.weight ?? 1,
    date: grade.date || '',
  });
}

export function updateGrade(gradeId, data, userId) {
  const row = {};
  if ('label' in data)    row.label     = data.label;
  if ('score' in data)    row.score     = data.score;
  if ('maxScore' in data) row.max_score = data.maxScore;
  if ('weight' in data)   row.weight    = data.weight;
  if ('date' in data)     row.date      = data.date;
  if (!Object.keys(row).length) return Promise.resolve({ error: null });
  return supabase.from('grades').update(row).eq('id', gradeId).eq('user_id', userId);
}

export function deleteGrade(gradeId, userId) {
  return supabase.from('grades').delete().eq('id', gradeId).eq('user_id', userId);
}

// ── Timetable Entries ─────────────────────────────────────────────────────
export function insertTimetableEntry(entry, userId) {
  return supabase.from('timetable_entries').insert({
    id: entry.id,
    user_id: userId,
    semester_id: entry.semesterId,
    course_id: entry.courseId || null,
    label: entry.label || '',
    location: entry.location || '',
    professor: entry.professor || '',
    day_of_week: entry.dayOfWeek ?? 1,
    start_time: entry.startTime || '09:00',
    end_time: entry.endTime || '10:00',
    color: entry.color || '#4ade80',
    type: entry.type || 'lecture',
  });
}

export function updateTimetableEntry(id, data, userId) {
  const row = {};
  if ('label' in data)     row.label       = data.label;
  if ('location' in data)  row.location    = data.location;
  if ('professor' in data) row.professor   = data.professor;
  if ('dayOfWeek' in data) row.day_of_week = data.dayOfWeek;
  if ('startTime' in data) row.start_time  = data.startTime;
  if ('endTime' in data)   row.end_time    = data.endTime;
  if ('color' in data)     row.color       = data.color;
  if ('type' in data)      row.type        = data.type;
  if ('courseId' in data)  row.course_id   = data.courseId;
  if (!Object.keys(row).length) return Promise.resolve({ error: null });
  return supabase.from('timetable_entries').update(row).eq('id', id).eq('user_id', userId);
}

export function deleteTimetableEntry(id, userId) {
  return supabase.from('timetable_entries').delete().eq('id', id).eq('user_id', userId);
}

// ── Tasks ─────────────────────────────────────────────────────────────────
export function insertTask(task, userId) {
  return supabase.from('tasks').insert({
    id: task.id,
    user_id: userId,
    semester_id: task.semesterId,
    course_id: task.courseId || null,
    title: task.title || '',
    type: task.type || 'assignment',
    due_date: task.dueDate || '',
    due_time: task.dueTime || '23:59',
    description: task.description || '',
    completed: task.completed || false,
    completed_at: task.completedAt || null,
    priority: task.priority || 'medium',
    reminder_days: task.reminderDays ?? 3,
  });
}

export function updateTask(id, data, userId) {
  const row = {};
  if ('title' in data)        row.title        = data.title;
  if ('type' in data)         row.type         = data.type;
  if ('dueDate' in data)      row.due_date      = data.dueDate;
  if ('dueTime' in data)      row.due_time      = data.dueTime;
  if ('description' in data)  row.description  = data.description;
  if ('completed' in data)    row.completed    = data.completed;
  if ('completedAt' in data)  row.completed_at = data.completedAt;
  if ('priority' in data)     row.priority     = data.priority;
  if ('reminderDays' in data) row.reminder_days = data.reminderDays;
  if ('courseId' in data)     row.course_id    = data.courseId;
  if (!Object.keys(row).length) return Promise.resolve({ error: null });
  return supabase.from('tasks').update(row).eq('id', id).eq('user_id', userId);
}

export function deleteTask(id, userId) {
  return supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
}

// ── Study Hours ───────────────────────────────────────────────────────────
export function upsertStudyHours(courseId, totalSeconds, userId) {
  return supabase.from('study_hours').upsert(
    { user_id: userId, course_id: courseId, total_seconds: totalSeconds, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id' }
  );
}

// ── Profile / Settings ────────────────────────────────────────────────────
export function upsertProfile(settings, userId) {
  return supabase.from('profiles').upsert({
    id: userId,
    theme: settings.theme,
    active_semester_id: settings.activeSemesterId,
    gpa_scale: settings.gpaScale,
    grade_display: settings.gradeDisplay,
    week_starts_on: settings.weekStartsOn,
    student_type: settings.studentType,
    school: settings.school,
    permit_expiry_date: settings.permitExpiryDate || null,
    student_name: settings.studentName,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
}

// Calendar-sync columns (ics_token, calendar_connected) live behind migration
// 002. They are written ONLY here — never in upsertProfile — so ordinary
// settings saves keep working even before an operator has run 002. If the
// migration is missing, only this call fails (surfaced as a toast).
export function updateProfileCalendar(userId, { icsToken, calendarConnected }) {
  const row = { id: userId, updated_at: new Date().toISOString() };
  if (icsToken !== undefined) row.ics_token = icsToken;
  if (calendarConnected !== undefined) row.calendar_connected = calendarConnected;
  return supabase.from('profiles').upsert(row, { onConflict: 'id' });
}
