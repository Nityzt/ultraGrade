import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { randomCourseColor } from '../utils/colorHelpers.js';
import { getDefaultGpaScale } from '../data/universities.js';

const AppContext = createContext(null);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DEFAULT_SETTINGS = {
  theme: 'ultragrade-dark',
  activeSemesterId: null,
  gpaScale: 'standard-4.0',
  gradeDisplay: 'percentage',
  weekStartsOn: 1,
  studentType: null,
  school: '',
  permitExpiryDate: null,
  studentName: ''
};

export function AppProvider({ children }) {
  const [semesters, setSemesters] = useLocalStorage('ultragrade_semesters', []);
  const [courses, setCourses] = useLocalStorage('ultragrade_courses', []);
  const [timetableEntries, setTimetableEntries] = useLocalStorage('ultragrade_timetable', []);
  const [tasks, setTasks] = useLocalStorage('ultragrade_tasks', []);
  const [settings, setSettings] = useLocalStorage('ultragrade_settings', DEFAULT_SETTINGS);
  const [studyHours, setStudyHours] = useLocalStorage('ultragrade_study_hours', {});

  // Derived
  const activeSemester = semesters.find(s => s.id === settings.activeSemesterId) || semesters[0] || null;
  const activeCourses = courses.filter(c => c.semesterId === activeSemester?.id);
  const activeTasks = tasks.filter(t => t.semesterId === activeSemester?.id);
  const activeTimetable = timetableEntries.filter(e => e.semesterId === activeSemester?.id);

  // Settings
  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // Apply theme to html element
      if (updates.theme) document.documentElement.setAttribute('data-theme', updates.theme);
      return next;
    });
  }, [setSettings]);

  const setStudentType = useCallback((type) => updateSettings({ studentType: type }), [updateSettings]);

  const updateSchool = useCallback((school) => {
    const defaultScale = getDefaultGpaScale(school);
    updateSettings({ school, gpaScale: defaultScale });
  }, [updateSettings]);

  // Semester CRUD
  const addSemester = useCallback((data) => {
    const sem = { id: generateId(), name: '', startDate: '', endDate: '', ...data };
    setSemesters(prev => [...prev, sem]);
    updateSettings({ activeSemesterId: sem.id });
    return sem;
  }, [setSemesters, updateSettings]);

  const updateSemester = useCallback((id, data) => {
    setSemesters(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, [setSemesters]);

  const deleteSemester = useCallback((id) => {
    setSemesters(prev => prev.filter(s => s.id !== id));
    setCourses(prev => prev.filter(c => c.semesterId !== id));
    setTasks(prev => prev.filter(t => t.semesterId !== id));
    setTimetableEntries(prev => prev.filter(e => e.semesterId !== id));
    if (settings.activeSemesterId === id) {
      const remaining = semesters.filter(s => s.id !== id);
      updateSettings({ activeSemesterId: remaining[0]?.id || null });
    }
  }, [setSemesters, setCourses, setTasks, setTimetableEntries, settings, semesters, updateSettings]);

  const setActiveSemester = useCallback((id) => updateSettings({ activeSemesterId: id }), [updateSettings]);

  // Course CRUD
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
      studyTimerSeconds: 0,
      ...data
    };
    setCourses(prev => [...prev, course]);
    return course;
  }, [setCourses, activeSemester]);

  const updateCourse = useCallback((id, data) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, [setCourses]);

  const deleteCourse = useCallback((id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.filter(t => t.courseId !== id));
    setTimetableEntries(prev => prev.filter(e => e.courseId !== id));
  }, [setCourses, setTasks, setTimetableEntries]);

  // Category CRUD (nested in course)
  const addCategory = useCallback((courseId, data) => {
    const cat = { id: generateId(), name: '', weight: 0, dropLowest: false, grades: [], ...data };
    setCourses(prev => prev.map(c =>
      c.id === courseId ? { ...c, categories: [...(c.categories || []), cat] } : c
    ));
    return cat;
  }, [setCourses]);

  const updateCategory = useCallback((courseId, catId, data) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, categories: c.categories.map(cat => cat.id === catId ? { ...cat, ...data } : cat) }
        : c
    ));
  }, [setCourses]);

  const deleteCategory = useCallback((courseId, catId) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? { ...c, categories: c.categories.filter(cat => cat.id !== catId) }
        : c
    ));
  }, [setCourses]);

  // Grade CRUD (nested in category)
  const addGrade = useCallback((courseId, catId, data) => {
    const grade = { id: generateId(), label: '', score: 0, maxScore: 100, weight: 1, date: '', ...data };
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? {
            ...c,
            categories: c.categories.map(cat =>
              cat.id === catId ? { ...cat, grades: [...(cat.grades || []), grade] } : cat
            )
          }
        : c
    ));
    return grade;
  }, [setCourses]);

  const updateGrade = useCallback((courseId, catId, gradeId, data) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? {
            ...c,
            categories: c.categories.map(cat =>
              cat.id === catId
                ? { ...cat, grades: cat.grades.map(g => g.id === gradeId ? { ...g, ...data } : g) }
                : cat
            )
          }
        : c
    ));
  }, [setCourses]);

  const deleteGrade = useCallback((courseId, catId, gradeId) => {
    setCourses(prev => prev.map(c =>
      c.id === courseId
        ? {
            ...c,
            categories: c.categories.map(cat =>
              cat.id === catId
                ? { ...cat, grades: cat.grades.filter(g => g.id !== gradeId) }
                : cat
            )
          }
        : c
    ));
  }, [setCourses]);

  // Timetable CRUD
  const addTimetableEntry = useCallback((data) => {
    const entry = { id: generateId(), semesterId: activeSemester?.id, courseId: null, ...data };
    setTimetableEntries(prev => [...prev, entry]);
    return entry;
  }, [setTimetableEntries, activeSemester]);

  const updateTimetableEntry = useCallback((id, data) => {
    setTimetableEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, [setTimetableEntries]);

  const deleteTimetableEntry = useCallback((id) => {
    setTimetableEntries(prev => prev.filter(e => e.id !== id));
  }, [setTimetableEntries]);

  // Task CRUD
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
    return task;
  }, [setTasks, activeSemester]);

  const updateTask = useCallback((id, data) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);

  const toggleTaskComplete = useCallback((id) => {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
        : t
    ));
  }, [setTasks]);

  // Bulk import from outline parser
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

    // Add timetable entries
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

    // Add tasks from deadlines
    for (const dl of parsed.deadlines || []) {
      addTask({
        title: dl.title,
        type: dl.type || 'assignment',
        dueDate: dl.date,
        courseId: course.id
      });
    }

    return course;
  }, [addCourse, addTimetableEntry, addTask]);

  // Study hours
  const addStudyTime = useCallback((courseId, seconds) => {
    setStudyHours(prev => ({ ...prev, [courseId]: (prev[courseId] || 0) + seconds }));
  }, [setStudyHours]);

  const getStudyHours = useCallback((courseId) => {
    return studyHours[courseId] || 0;
  }, [studyHours]);

  // Apply saved theme on load
  const currentTheme = settings.theme || 'ultragrade-dark';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }

  const value = {
    semesters, courses, timetableEntries, tasks, settings, studyHours,
    activeSemester, activeCourses, activeTasks, activeTimetable,
    updateSettings, setStudentType, updateSchool,
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
