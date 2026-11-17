import { useCallback, useState } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { API_BASE_URL } from '../../lib/apiBase.js';
import { randomCourseColor } from '../../utils/colorHelpers.js';

/**
 * NL quick-add ("essay due next fri 20%" -> a dated task on the right course).
 * Posts to the JWT-protected /api/quick-add, then commits through existing
 * AppContext actions (addTask/addGrade/addTimetableEntry). Extracted from the
 * old standalone QuickAddBar so the CommandPalette can drive it as one row
 * among navigation/action items.
 */
export function useQuickAdd() {
  const { addTask, addTimetableEntry, addGrade, updateTask, activeCourses, activeTasks, courses, activeSemester } = useApp();

  const [status, setStatus] = useState('idle'); // idle | loading | preview | error
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStatus('idle');
    setParsed(null);
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
          courses: activeCourses.map((c) => ({ id: c.id, code: c.code, name: c.name })),
          tasks: activeTasks.filter(t => !t.completed).map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            courseCode: courses.find(c => c.id === t.courseId)?.code || '',
          })),
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.data.success) {
        setParsed(res.data.data);
        setStatus('preview');
      } else {
        throw new Error(res.data.error || 'Quick-add failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not add that.');
      setStatus('error');
    }
  }, [activeSemester, activeCourses]);

  const course = parsed?.courseId ? courses.find((c) => c.id === parsed.courseId) : null;

  // For a grade, resolve the target category by name (case-insensitive).
  const gradeCategory =
    parsed?.kind === 'grade' && course
      ? (course.categories || []).find(
          (cat) => cat.name.toLowerCase() === (parsed.category || '').toLowerCase()
        )
      : null;

  const commit = useCallback(() => {
    if (!parsed) return;
    if (parsed.action === 'complete_task') {
      updateTask(parsed.taskId, { completed: true, completedAt: new Date().toISOString() });
    } else if (parsed.action === 'reschedule_task') {
      updateTask(parsed.taskId, { dueDate: parsed.dueDate, dueTime: parsed.dueTime || '23:59' });
    } else if (parsed.kind === 'task') {
      addTask({
        title: parsed.title,
        type: parsed.taskType || 'assignment',
        dueDate: parsed.dueDate || '',
        dueTime: parsed.dueTime || '23:59',
        priority: parsed.priority || 'medium',
        courseId: parsed.courseId || null,
      });
    } else if (parsed.kind === 'class') {
      addTimetableEntry({
        label: course ? `${course.code} ${parsed.classType || 'lecture'}` : (parsed.location || 'Class'),
        courseId: parsed.courseId || null,
        dayOfWeek: parsed.dayOfWeek,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        location: parsed.location || '',
        professor: course?.professor || '',
        color: course?.color || randomCourseColor(),
        type: parsed.classType || 'lecture',
      });
    } else if (parsed.kind === 'grade' && gradeCategory) {
      addGrade(parsed.courseId, gradeCategory.id, {
        label: parsed.label || parsed.category || 'Grade',
        score: parsed.score,
        maxScore: parsed.maxScore,
      });
    }
  }, [parsed, course, gradeCategory, addTask, addTimetableEntry, addGrade, updateTask]);

  const canCommit = parsed
    && !(parsed.kind === 'grade' && !gradeCategory)
    && (!['complete_task', 'reschedule_task'].includes(parsed.action) || activeTasks.some(t => t.id === parsed.taskId));

  return { status, parsed, error, course, gradeCategory, submit, commit, canCommit, reset };
}
