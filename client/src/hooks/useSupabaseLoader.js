import { supabase } from '../lib/supabase.js';

const toSemester = (r) => ({
  id: r.id,
  name: r.name,
  startDate: r.start_date,
  endDate: r.end_date,
  isActive: r.is_active,
});

const toCourse = (r) => ({
  id: r.id,
  semesterId: r.semester_id,
  code: r.code,
  name: r.name,
  professor: r.professor,
  creditHours: parseFloat(r.credit_hours),
  targetGrade: parseFloat(r.target_grade),
  color: r.color,
  notes: r.notes,
  outlineUploaded: r.outline_uploaded,
  finalGradeOverride: r.final_grade_override != null ? parseFloat(r.final_grade_override) : null,
  categories: [],
});

const toCategory = (r) => ({
  id: r.id,
  name: r.name,
  weight: parseFloat(r.weight),
  dropLowest: r.drop_lowest,
  position: r.position,
  grades: [],
});

const toGrade = (r) => ({
  id: r.id,
  label: r.label,
  score: parseFloat(r.score),
  maxScore: parseFloat(r.max_score),
  weight: parseFloat(r.weight),
  date: r.date,
});

const toTimetableEntry = (r) => ({
  id: r.id,
  semesterId: r.semester_id,
  courseId: r.course_id,
  label: r.label,
  location: r.location,
  professor: r.professor,
  dayOfWeek: r.day_of_week,
  startTime: r.start_time,
  endTime: r.end_time,
  color: r.color,
  type: r.type,
});

const toTask = (r) => ({
  id: r.id,
  semesterId: r.semester_id,
  courseId: r.course_id,
  title: r.title,
  type: r.type,
  dueDate: r.due_date,
  dueTime: r.due_time,
  description: r.description,
  completed: r.completed,
  completedAt: r.completed_at,
  priority: r.priority,
  reminderDays: r.reminder_days,
});

const toSettings = (r) => ({
  theme: r.theme || 'ultragrade-classic',
  activeSemesterId: r.active_semester_id || null,
  gpaScale: r.gpa_scale || 'standard-4.0',
  gradeDisplay: r.grade_display || 'percentage',
  weekStartsOn: r.week_starts_on ?? 1,
  studentType: r.student_type || null,
  school: r.school || '',
  permitExpiryDate: r.permit_expiry_date || null,
  studentName: r.student_name || '',
  icsToken: r.ics_token || null,
  calendarConnected: r.calendar_connected || false,
});

export async function loadAll(userId) {
  try {
    const [
      { data: semRows, error: e1 },
      { data: courseRows, error: e2 },
      { data: catRows, error: e3 },
      { data: gradeRows, error: e4 },
      { data: ttRows, error: e5 },
      { data: taskRows, error: e6 },
      { data: shRows, error: e7 },
      { data: profileRow, error: e8 },
    ] = await Promise.all([
      supabase.from('semesters').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('courses').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('categories').select('*').eq('user_id', userId).order('position'),
      supabase.from('grades').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('timetable_entries').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('study_hours').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ]);

    if (e1 || e2 || e3 || e4 || e5 || e6 || e7) {
      return { error: e1 || e2 || e3 || e4 || e5 || e6 || e7 };
    }

    // Build nested courses structure
    const courseMap = {};
    for (const r of courseRows || []) courseMap[r.id] = toCourse(r);

    const catMap = {};
    for (const r of catRows || []) {
      catMap[r.id] = toCategory(r);
      if (courseMap[r.course_id]) courseMap[r.course_id].categories.push(catMap[r.id]);
    }
    for (const r of gradeRows || []) {
      if (catMap[r.category_id]) catMap[r.category_id].grades.push(toGrade(r));
    }

    const studyHours = {};
    for (const r of shRows || []) studyHours[r.course_id] = r.total_seconds;

    return {
      semesters: (semRows || []).map(toSemester),
      courses: Object.values(courseMap),
      timetableEntries: (ttRows || []).map(toTimetableEntry),
      tasks: (taskRows || []).map(toTask),
      settings: e8 || !profileRow ? null : toSettings(profileRow),
      studyHours,
      error: null,
    };
  } catch (err) {
    return { error: err };
  }
}
