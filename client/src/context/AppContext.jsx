import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { randomCourseColor } from '../utils/colorHelpers.js';
import { getDefaultGpaScale } from '../data/universities.js';
import { useAuth } from './AuthContext.jsx';
import { loadAll } from '../hooks/useSupabaseLoader.js';
import * as sync from '../hooks/useSupabaseSync.js';

const AppContext = createContext(null);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DEFAULT_SETTINGS = {
  theme: 'ultragrade-classic',
  activeSemesterId: null,
  gpaScale: 'standard-4.0',
  gradeDisplay: 'percentage',
  weekStartsOn: 1,
  studentType: null,
  school: '',
  permitExpiryDate: null,
  studentName: '',
  icsToken: null,
  calendarConnected: false
};

export function AppProvider({ children }) {
  const { user } = useAuth();

  const [semesters, setSemesters] = useLocalStorage('ultragrade_semesters', []);
  const [courses, setCourses] = useLocalStorage('ultragrade_courses', []);
  const [timetableEntries, setTimetableEntries] = useLocalStorage('ultragrade_timetable', []);
  const [tasks, setTasks] = useLocalStorage('ultragrade_tasks', []);
  const [settings, setSettings] = useLocalStorage('ultragrade_settings', DEFAULT_SETTINGS);
  const [studyHours, setStudyHours] = useLocalStorage('ultragrade_study_hours', {});
  // Track WHICH user's data is loaded, not just "loaded at all". `isLoaded` is
  // then derived synchronously from the current user — so the instant the user
  // changes (e.g. right after sign-in, when navigate('/') renders the route
  // guards), it reads false without waiting for the load effect to run. A plain
  // boolean left a stale `true` from the logged-out branch, which let
  // RequireStudentType redirect to /onboarding before the profile hydrated
  // (the "asks for student type every time" bug).
  const [loadedUserId, setLoadedUserId] = useState(undefined);
  const [syncError, setSyncError] = useState(null);
  const isLoaded = loadedUserId === (user?.id ?? null);

  // Load all data from Supabase when user signs in
  useEffect(() => {
    if (!user) { setLoadedUserId(null); return; }
    const uid = user.id;
    loadAll(uid).then(({ semesters: s, courses: c, timetableEntries: te, tasks: t, settings: sets, studyHours: sh, error }) => {
      if (!error) {
        if (s)   setSemesters(s);
        if (c)   setCourses(c);
        if (te)  setTimetableEntries(te);
        if (t)   setTasks(t);
        if (sets) setSettings(prev => ({ ...prev, ...sets }));
        if (sh)  setStudyHours(sh);
      }
      // Mark this user as loaded even on error, so the guards stop spinning and
      // fall through to whatever the (cached/default) settings say.
      setLoadedUserId(uid);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onSyncError = (msg) => setSyncError(msg);

  // Derived state
  const activeSemester = semesters.find(s => s.id === settings.activeSemesterId) || semesters[0] || null;
  const activeCourses = courses.filter(c => c.semesterId === activeSemester?.id);
  const activeTasks = tasks.filter(t => t.semesterId === activeSemester?.id);
  const activeTimetable = timetableEntries.filter(e => e.semesterId === activeSemester?.id);

  // ── Settings ──────────────────────────────────────────────────────────────
  // settingsRef tracks the latest settings SYNCHRONOUSLY. Two updateSettings
  // calls in the same tick (e.g. onboarding finish(): addSemester → activeSemesterId,
  // then setStudentType) would otherwise both read the same stale `settings`
  // closure and the second would clobber the first — in state AND in the
  // profile upsert. (The sync call lives outside the setState updater on
  // purpose: updaters run twice under StrictMode.)
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Pending insert syncs keyed by entity id, so dependent inserts (FK rows)
  // can chain after their parent row has committed. Sync fns may return
  // Supabase PromiseLike thenables (no `.finally`), so normalise via
  // Promise.resolve before tracking.
  const pendingSyncs = useRef(new Map());
  const trackPending = (id, promise) => {
    const p = Promise.resolve(promise);
    pendingSyncs.current.set(id, p);
    p.finally(() => pendingSyncs.current.delete(id));
    return p;
  };
  const afterParent = (id) =>
    (id && pendingSyncs.current.get(id)) || Promise.resolve({ error: null });
  const updateSettings = useCallback((updates) => {
    const next = { ...settingsRef.current, ...updates };
    settingsRef.current = next;
    setSettings(next);
    if (user) sync.upsertProfile(next, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to save settings');
    });
  }, [setSettings, user]);

  const setStudentType = useCallback((type) => updateSettings({ studentType: type }), [updateSettings]);

  const updateSchool = useCallback((school) => {
    const defaultScale = getDefaultGpaScale(school);
    updateSettings({ school, gpaScale: defaultScale });
  }, [updateSettings]);

  // Calendar sync (ICS feed token + Google-connected flag). Writes go through a
  // dedicated sync fn (updateProfileCalendar) that only touches the migration-002
  // columns, so ordinary settings saves are unaffected if 002 hasn't been run.
  const setCalendarSync = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
    if (user) sync.updateProfileCalendar(user.id, {
      icsToken: 'icsToken' in updates ? updates.icsToken : undefined,
      calendarConnected: 'calendarConnected' in updates ? updates.calendarConnected : undefined,
    }).then(({ error }) => {
      if (error) onSyncError('Failed to save calendar settings — has migration 002 been run?');
    });
  }, [setSettings, user]);

  // ── Semesters ─────────────────────────────────────────────────────────────
  const addSemester = useCallback((data) => {
    const sem = { id: generateId(), name: '', startDate: '', endDate: '', ...data };
    setSemesters(prev => [...prev, sem]);
    updateSettings({ activeSemesterId: sem.id });
    if (user) trackPending(sem.id, sync.insertSemester(sem, user.id)).then(({ error }) => {
      if (error) { setSemesters(prev => prev.filter(s => s.id !== sem.id)); onSyncError('Failed to save semester'); }
    });
    return sem;
  }, [setSemesters, updateSettings, user]);

  const updateSemester = useCallback((id, data) => {
    setSemesters(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    if (user) sync.updateSemester(id, data, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to update semester');
    });
  }, [setSemesters, user]);

  const deleteSemester = useCallback((id) => {
    const deletedCourseIds = courses.filter(c => c.semesterId === id).map(c => c.id);
    setSemesters(prev => prev.filter(s => s.id !== id));
    setCourses(prev => prev.filter(c => c.semesterId !== id));
    setTasks(prev => prev.filter(t => t.semesterId !== id));
    setTimetableEntries(prev => prev.filter(e => e.semesterId !== id));
    setStudyHours(prev => {
      const next = { ...prev };
      deletedCourseIds.forEach(cid => delete next[cid]);
      return next;
    });
    if (settings.activeSemesterId === id) {
      const remaining = semesters.filter(s => s.id !== id);
      updateSettings({ activeSemesterId: remaining[0]?.id || null });
    }
    if (user) sync.deleteSemester(id, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to delete semester');
    });
  }, [setSemesters, setCourses, setTasks, setTimetableEntries, setStudyHours, settings, semesters, courses, updateSettings, user]);

  const setActiveSemester = useCallback((id) => updateSettings({ activeSemesterId: id }), [updateSettings]);

  // ── Courses ───────────────────────────────────────────────────────────────
  const addCourse = useCallback((data) => {
    const course = {
      id: generateId(),
      semesterId: activeSemester?.id,
      code: '',
      name: '',
      professor: '',
      creditHours: 3,
      targetGrade: 70,
      color: randomCourseColor(),
      categories: [],
      finalGradeOverride: null,
      outlineUploaded: false,
      notes: '',
      ...data
    };
    setCourses(prev => [...prev, course]);
    if (user) trackPending(course.id,
      afterParent(course.semesterId).then(({ error: parentErr }) =>
        parentErr ? { error: parentErr } : sync.insertCourse(course, user.id)
      )
    ).then(({ error }) => {
      if (error) { setCourses(prev => prev.filter(c => c.id !== course.id)); onSyncError('Failed to save course'); }
    });
    return course;
  }, [setCourses, activeSemester, user]);

  const updateCourse = useCallback((id, data) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    if (user) sync.updateCourse(id, data, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to update course');
    });
  }, [setCourses, user]);

  const deleteCourse = useCallback((id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.filter(t => t.courseId !== id));
    setTimetableEntries(prev => prev.filter(e => e.courseId !== id));
    if (user) sync.deleteCourse(id, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to delete course');
    });
  }, [setCourses, setTasks, setTimetableEntries, user]);

  // ── Categories ────────────────────────────────────────────────────────────
  const addCategory = useCallback((courseId, data) => {
    const cat = { id: generateId(), name: '', weight: 0, dropLowest: false, grades: [], ...data };
    setCourses(prev => prev.map(c =>
      c.id === courseId ? { ...c, categories: [...(c.categories || []), cat] } : c
    ));
    if (user) {
      const position = (courses.find(c => c.id === courseId)?.categories || []).length;
      sync.insertCategory(courseId, cat, position, user.id).then(({ error }) => {
        if (error) {
          setCourses(prev => prev.map(c =>
            c.id === courseId ? { ...c, categories: c.categories.filter(ca => ca.id !== cat.id) } : c
          ));
          onSyncError('Failed to save category');
        }
      });
    }
    return cat;
  }, [setCourses, courses, user]);

  const updateCategory = useCallback((courseId, catId, data) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, categories: c.categories.map(cat => cat.id === catId ? { ...cat, ...data } : cat) }
        : c
    ));
    if (user) sync.updateCategory(catId, data, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to update category');
    });
  }, [setCourses, user]);

  const deleteCategory = useCallback((courseId, catId) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, categories: c.categories.filter(cat => cat.id !== catId) }
        : c
    ));
    if (user) sync.deleteCategory(catId, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to delete category');
    });
  }, [setCourses, user]);

  // ── Grades ────────────────────────────────────────────────────────────────
  const addGrade = useCallback((courseId, catId, data) => {
    const grade = { id: generateId(), label: '', score: 0, maxScore: 100, weight: 1, date: '', ...data };
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, categories: c.categories.map(cat =>
            cat.id === catId ? { ...cat, grades: [...(cat.grades || []), grade] } : cat
          )}
        : c
    ));
    if (user) sync.insertGrade(catId, grade, user.id).then(({ error }) => {
      if (error) {
        setCourses(prev => prev.map(c =>
          c.id === courseId
            ? { ...c, categories: c.categories.map(cat =>
                cat.id === catId ? { ...cat, grades: cat.grades.filter(g => g.id !== grade.id) } : cat
              )}
            : c
        ));
        onSyncError('Failed to save grade');
      }
    });
    return grade;
  }, [setCourses, user]);

  const updateGrade = useCallback((courseId, catId, gradeId, data) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, categories: c.categories.map(cat =>
            cat.id === catId
              ? { ...cat, grades: cat.grades.map(g => g.id === gradeId ? { ...g, ...data } : g) }
              : cat
          )}
        : c
    ));
    if (user) sync.updateGrade(gradeId, data, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to update grade');
    });
  }, [setCourses, user]);

  const deleteGrade = useCallback((courseId, catId, gradeId) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, categories: c.categories.map(cat =>
            cat.id === catId
              ? { ...cat, grades: cat.grades.filter(g => g.id !== gradeId) }
              : cat
          )}
        : c
    ));
    if (user) sync.deleteGrade(gradeId, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to delete grade');
    });
  }, [setCourses, user]);

  // ── Timetable ─────────────────────────────────────────────────────────────
  const addTimetableEntry = useCallback((data) => {
    const entry = { id: generateId(), semesterId: activeSemester?.id, courseId: null, ...data };
    setTimetableEntries(prev => [...prev, entry]);
    if (user) afterParent(entry.courseId || entry.semesterId).then(({ error: parentErr }) =>
      parentErr ? { error: parentErr } : sync.insertTimetableEntry(entry, user.id)
    ).then(({ error }) => {
      if (error) { setTimetableEntries(prev => prev.filter(e => e.id !== entry.id)); onSyncError('Failed to save class'); }
    });
    return entry;
  }, [setTimetableEntries, activeSemester, user]);

  const updateTimetableEntry = useCallback((id, data) => {
    setTimetableEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    if (user) sync.updateTimetableEntry(id, data, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to update class');
    });
  }, [setTimetableEntries, user]);

  const deleteTimetableEntry = useCallback((id) => {
    setTimetableEntries(prev => prev.filter(e => e.id !== id));
    if (user) sync.deleteTimetableEntry(id, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to delete class');
    });
  }, [setTimetableEntries, user]);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const addTask = useCallback((data) => {
    const task = {
      id: generateId(),
      semesterId: activeSemester?.id,
      courseId: null,
      title: '',
      type: 'assignment',
      dueDate: '',
      dueTime: '23:59',
      description: '',
      completed: false,
      completedAt: null,
      priority: 'medium',
      reminderDays: 3,
      ...data
    };
    setTasks(prev => [...prev, task]);
    if (user) afterParent(task.courseId || task.semesterId).then(({ error: parentErr }) =>
      parentErr ? { error: parentErr } : sync.insertTask(task, user.id)
    ).then(({ error }) => {
      if (error) { setTasks(prev => prev.filter(t => t.id !== task.id)); onSyncError('Failed to save task'); }
    });
    return task;
  }, [setTasks, activeSemester, user]);

  const updateTask = useCallback((id, data) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    if (user) sync.updateTask(id, data, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to update task');
    });
  }, [setTasks, user]);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (user) sync.deleteTask(id, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to delete task');
    });
  }, [setTasks, user]);

  const toggleTaskComplete = useCallback((id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const completed = !task.completed;
    const completedAt = completed ? new Date().toISOString() : null;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed, completedAt } : t));
    if (user) sync.updateTask(id, { completed, completedAt }, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to update task');
    });
  }, [setTasks, tasks, user]);

  // ── Outline import ────────────────────────────────────────────────────────
  const importFromOutline = useCallback((parsed) => {
    const courseData = {
      code: parsed.courseCode || '',
      name: parsed.courseName || '',
      professor: parsed.professor || '',
      creditHours: parsed.creditHours || 3,
      categories: (parsed.assessments || []).map(a => ({
        id: generateId(), name: a.name, weight: a.weight, dropLowest: false, grades: []
      })),
      outlineUploaded: true
    };
    const course = addCourse(courseData);

    for (const sched of parsed.schedule || []) {
      addTimetableEntry({
        label: `${courseData.code} ${sched.type || 'Lecture'}`,
        courseId: course.id,
        dayOfWeek: sched.dayOfWeek,
        startTime: sched.startTime,
        endTime: sched.endTime,
        location: sched.location || '',
        professor: courseData.professor,
        color: course.color,
        type: sched.type || 'lecture'
      });
    }

    for (const dl of parsed.deadlines || []) {
      addTask({ title: dl.title, type: dl.type || 'assignment', dueDate: dl.date, courseId: course.id });
    }

    return course;
  }, [addCourse, addTimetableEntry, addTask]);

  // ── Study hours ───────────────────────────────────────────────────────────
  const addStudyTime = useCallback((courseId, seconds) => {
    const total = (studyHours[courseId] || 0) + seconds;
    setStudyHours(prev => ({ ...prev, [courseId]: total }));
    if (user) sync.upsertStudyHours(courseId, total, user.id).then(({ error }) => {
      if (error) onSyncError('Failed to save study time');
    });
  }, [setStudyHours, studyHours, user]);

  const getStudyHours = useCallback((courseId) => studyHours[courseId] || 0, [studyHours]);

  // data-theme is applied by the single useEffect in App.jsx (keyed on settings.theme)
  // and, during an interactive toggle, synchronously by useThemeTransition for the reveal.

  const value = {
    semesters, courses, timetableEntries, tasks, settings, studyHours,
    activeSemester, activeCourses, activeTasks, activeTimetable,
    isLoaded, syncError,
    updateSettings, setStudentType, updateSchool, setCalendarSync,
    addSemester, updateSemester, deleteSemester, setActiveSemester,
    addCourse, updateCourse, deleteCourse,
    addCategory, updateCategory, deleteCategory,
    addGrade, updateGrade, deleteGrade,
    addTimetableEntry, updateTimetableEntry, deleteTimetableEntry,
    addTask, updateTask, deleteTask, toggleTaskComplete,
    importFromOutline, addStudyTime, getStudyHours
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
