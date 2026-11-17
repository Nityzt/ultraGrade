import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { API_BASE_URL } from '../../lib/apiBase.js';
import { randomCourseColor } from '../../utils/colorHelpers.js';

/**
 * NL quick-add ("essay due next fri 20%" -> a dated task on the right course).
 * Posts to the JWT-protected /api/quick-add, then commits through existing
 * AppContext actions (addTask/addGrade/addTimetableEntry/addCategory). The
 * server may split one note into up to 5 items ("essay friday and quiz
 * monday"), so state holds an array. Extracted from the old standalone
 * QuickAddBar so the CommandPalette can drive it as one row among
 * navigation/action items.
 */
export function useQuickAdd() {
  const { addTask, addTimetableEntry, addGrade, addCategory, updateTask, activeCourses, activeTasks, courses, activeSemester } = useApp();

  const [status, setStatus] = useState('idle'); // idle | loading | preview | error
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStatus('idle');
    setItems(null);
    setError('');
  }, []);

  const submit = useCallback(async (text) => {
    const q = text.trim();
    if (!q) return;
    if (!activeSemester) {
      setError('Create a semester first — quick-add attaches items to your active term.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Your session has expired. Please sign in again.');
        setStatus('error');
        return;
      }
      const res = await axios.post(
        `${API_BASE_URL}/api/quick-add`,
        {
          text: q,
          courses: activeCourses.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            categories: (c.categories || []).map((cat) => cat.name),
          })),
          tasks: activeTasks.filter((t) => !t.completed).map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            courseCode: courses.find((c) => c.id === t.courseId)?.code || '',
          })),
          semesterStart: activeSemester.startDate || '',
          semesterEnd: activeSemester.endDate || '',
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.data.success) {
        setItems(res.data.data);
        setStatus('preview');
      } else {
        throw new Error(res.data.error || 'Quick-add failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not add that.');
      setStatus('error');
    }
  }, [activeSemester, activeCourses, activeTasks, courses]);

  // Resolve each item's course + grade category (case-insensitive by name).
  // A grade with a course but no matching category is still committable — the
  // commit step auto-creates the category (weight from newCategoryWeight).
  const resolved = useMemo(() => {
    if (!items) return null;
    return items.map((item) => {
      const course = item.courseId ? courses.find((c) => c.id === item.courseId) : null;
      const gradeCategory =
        item.kind === 'grade' && course
          ? (course.categories || []).find(
              (cat) => cat.name.toLowerCase() === (item.category || '').toLowerCase()
            )
          : null;
      const isEdit = item.action === 'complete_task' || item.action === 'reschedule_task';
      const task = isEdit ? activeTasks.find((t) => t.id === item.taskId) : null;
      const committable = isEdit ? !!task : !(item.kind === 'grade' && !course);
      return { item, course, gradeCategory, task, committable };
    });
  }, [items, courses, activeTasks]);

  const commit = useCallback(() => {
    if (!resolved) return;
    resolved.forEach(({ item, course, gradeCategory, committable }) => {
      if (!committable) return;
      if (item.action === 'complete_task') {
        updateTask(item.taskId, { completed: true, completedAt: new Date().toISOString() });
      } else if (item.action === 'reschedule_task') {
        updateTask(item.taskId, { dueDate: item.dueDate, dueTime: item.dueTime || '23:59' });
      } else if (item.kind === 'task') {
        addTask({
          title: item.title,
          type: item.taskType || 'assignment',
          dueDate: item.dueDate || '',
          dueTime: item.dueTime || '23:59',
          priority: item.priority || 'medium',
          courseId: item.courseId || null,
        });
      } else if (item.kind === 'class') {
        addTimetableEntry({
          label: course ? `${course.code} ${item.classType || 'lecture'}` : (item.location || 'Class'),
          courseId: item.courseId || null,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          location: item.location || '',
          professor: course?.professor || '',
          color: course?.color || randomCourseColor(),
          type: item.classType || 'lecture',
        });
      } else if (item.kind === 'grade') {
        // addCategory returns the created category synchronously (optimistic).
        const category = gradeCategory
          || addCategory(item.courseId, { name: item.category || 'Grade', weight: item.newCategoryWeight ?? 0 });
        addGrade(item.courseId, category.id, {
          label: item.label || item.category || 'Grade',
          score: item.score,
          maxScore: item.maxScore,
        });
      }
    });
  }, [resolved, addTask, addTimetableEntry, addGrade, addCategory, updateTask]);

  const canCommit = !!resolved?.some((r) => r.committable);

  return { status, items: resolved, error, submit, commit, canCommit, reset };
}
