import { supabase } from '../lib/supabase.js';

export function hasLocalStorageData() {
  try {
    const semesters = JSON.parse(localStorage.getItem('ultragrade_semesters') || '[]');
    const done = localStorage.getItem('ultragrade_migrated') === '1';
    return semesters.length > 0 && !done;
  } catch {
    return false;
  }
}

export async function migrateLocalStorageToSupabase(userId) {
  try {
    const semesters   = JSON.parse(localStorage.getItem('ultragrade_semesters')  || '[]');
    const courses     = JSON.parse(localStorage.getItem('ultragrade_courses')    || '[]');
    const timetable   = JSON.parse(localStorage.getItem('ultragrade_timetable')  || '[]');
    const tasks       = JSON.parse(localStorage.getItem('ultragrade_tasks')      || '[]');
    const settingsRaw = JSON.parse(localStorage.getItem('ultragrade_settings')   || '{}');
    const shRaw       = JSON.parse(localStorage.getItem('ultragrade_study_hours')|| '{}');

    if (!semesters.length) return { count: 0, error: null };

    let count = 0;

    // 1. Profile / settings
    const profileRow = {
      id: userId,
      theme:              settingsRaw.theme              || 'ultragrade-dark',
      active_semester_id: settingsRaw.activeSemesterId  || null,
      gpa_scale:          settingsRaw.gpaScale           || 'standard-4.0',
      grade_display:      settingsRaw.gradeDisplay       || 'percentage',
      week_starts_on:     settingsRaw.weekStartsOn       ?? 1,
      student_type:       settingsRaw.studentType        || null,
      school:             settingsRaw.school             || '',
      permit_expiry_date: settingsRaw.permitExpiryDate   || null,
      student_name:       settingsRaw.studentName        || '',
    };
    const { error: pe } = await supabase.from('profiles')
      .upsert(profileRow, { onConflict: 'id' });
    if (pe) return { count, error: pe };

    // 2. Semesters
    if (semesters.length) {
      const rows = semesters.map(s => ({
        id: s.id, user_id: userId,
        name: s.name || '', start_date: s.startDate || '', end_date: s.endDate || '',
        is_active: s.isActive || false,
      }));
      const { error } = await supabase.from('semesters').upsert(rows, { ignoreDuplicates: true });
      if (error) return { count, error };
      count += rows.length;
    }

    // 3. Courses (flatten — strip categories before inserting)
    if (courses.length) {
      const rows = courses.map(c => ({
        id: c.id, user_id: userId, semester_id: c.semesterId,
        code: c.code || '', name: c.name || '', professor: c.professor || '',
        credit_hours: c.creditHours ?? 3, target_grade: c.targetGrade ?? 70,
        color: c.color || '#4ade80', notes: c.notes || '',
        outline_uploaded: c.outlineUploaded || false,
        final_grade_override: c.finalGradeOverride ?? null,
      }));
      const { error } = await supabase.from('courses').upsert(rows, { ignoreDuplicates: true });
      if (error) return { count, error };
      count += rows.length;
    }

    // 4. Categories
    const allCats = courses.flatMap((c, _ci) =>
      (c.categories || []).map((cat, i) => ({
        id: cat.id, user_id: userId, course_id: c.id,
        name: cat.name || '', weight: cat.weight ?? 0,
        drop_lowest: cat.dropLowest || false, position: i,
      }))
    );
    if (allCats.length) {
      const { error } = await supabase.from('categories').upsert(allCats, { ignoreDuplicates: true });
      if (error) return { count, error };
      count += allCats.length;
    }

    // 5. Grades
    const allGrades = courses.flatMap(c =>
      (c.categories || []).flatMap(cat =>
        (cat.grades || []).map(g => ({
          id: g.id, user_id: userId, category_id: cat.id,
          label: g.label || '', score: g.score ?? 0, max_score: g.maxScore ?? 100,
          weight: g.weight ?? 1, date: g.date || '',
        }))
      )
    );
    if (allGrades.length) {
      const { error } = await supabase.from('grades').upsert(allGrades, { ignoreDuplicates: true });
      if (error) return { count, error };
      count += allGrades.length;
    }

    // 6. Timetable entries
    if (timetable.length) {
      const rows = timetable.map(e => ({
        id: e.id, user_id: userId, semester_id: e.semesterId, course_id: e.courseId || null,
        label: e.label || '', location: e.location || '', professor: e.professor || '',
        day_of_week: e.dayOfWeek ?? 1, start_time: e.startTime || '09:00',
        end_time: e.endTime || '10:00', color: e.color || '#4ade80', type: e.type || 'lecture',
      }));
      const { error } = await supabase.from('timetable_entries').upsert(rows, { ignoreDuplicates: true });
      if (error) return { count, error };
      count += rows.length;
    }

    // 7. Tasks
    if (tasks.length) {
      const rows = tasks.map(t => ({
        id: t.id, user_id: userId, semester_id: t.semesterId, course_id: t.courseId || null,
        title: t.title || '', type: t.type || 'assignment',
        due_date: t.dueDate || '', due_time: t.dueTime || '23:59',
        description: t.description || '', completed: t.completed || false,
        completed_at: t.completedAt || null, priority: t.priority || 'medium',
        reminder_days: t.reminderDays ?? 3,
      }));
      const { error } = await supabase.from('tasks').upsert(rows, { ignoreDuplicates: true });
      if (error) return { count, error };
      count += rows.length;
    }

    // 8. Study hours
    const shEntries = Object.entries(shRaw);
    if (shEntries.length) {
      const rows = shEntries.map(([courseId, secs]) => ({
        user_id: userId, course_id: courseId, total_seconds: secs,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('study_hours')
        .upsert(rows, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
      if (error) return { count, error };
    }

    localStorage.setItem('ultragrade_migrated', '1');
    return { count, error: null };
  } catch (err) {
    return { count: 0, error: err };
  }
}
