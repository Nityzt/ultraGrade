import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { createDemoFixture, DEMO_PERSONA } from './fixtures.js';

const id = (prefix) => `${prefix}-${Date.now().toString(36)}`;

/** A deliberately local data store for /demo. It never imports or syncs Supabase. */
export default function DemoProvider({ children }) {
  const [courses, setCourses] = useState(() => createDemoFixture().courses);
  const [tasks, setTasks] = useState(() => createDemoFixture().tasks);
  const [timetableEntries, setTimetableEntries] = useState(() => createDemoFixture().timetableEntries);
  const [settings, setSettings] = useState(() => createDemoFixture().settings);
  const [studyHours, setStudyHours] = useState({});
  // The authenticated app's theme reconciler intentionally reads its own
  // provider. Demo has a nested provider, so establish its initial atmosphere
  // here without changing the existing transition mechanism.
  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') !== settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);
  const resetDemo = useCallback(() => {
    const fixture = createDemoFixture();
    setCourses(fixture.courses); setTasks(fixture.tasks); setTimetableEntries(fixture.timetableEntries);
    setSettings(fixture.settings); setStudyHours({});
  }, []);
  const semester = DEMO_PERSONA.semester;
  const updateSettings = useCallback((changes) => setSettings(prev => ({ ...prev, ...changes })), []);
  const addCourse = useCallback((data) => {
    const item = { id: id('demo-course'), semesterId: semester.id, code: '', name: '', professor: '', creditHours: 0.5, categories: [], ...data };
    setCourses(prev => [...prev, item]); return item;
  }, []);
  const updateCourse = useCallback((courseId, changes) => setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...changes } : c)), []);
  const addCategory = useCallback((courseId, data) => {
    const category = { id: id('demo-category'), name: '', weight: 0, dropLowest: false, grades: [], ...data };
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, categories: [...(c.categories || []), category] } : c));
    return category;
  }, []);
  const updateCategory = useCallback((courseId, categoryId, changes) => setCourses(prev => prev.map(c => c.id === courseId ? { ...c, categories: (c.categories || []).map(category => category.id === categoryId ? { ...category, ...changes } : category) } : c)), []);
  const deleteCategory = useCallback((courseId, categoryId) => setCourses(prev => prev.map(c => c.id === courseId ? { ...c, categories: (c.categories || []).filter(category => category.id !== categoryId) } : c)), []);
  const addGrade = useCallback((courseId, categoryId, data) => {
    const grade = { id: id('demo-grade'), label: '', score: 0, maxScore: 100, weight: 1, date: '', ...data };
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, categories: (c.categories || []).map(category => category.id === categoryId ? { ...category, grades: [...(category.grades || []), grade] } : category) } : c));
    return grade;
  }, []);
  const updateGrade = useCallback((courseId, categoryId, gradeId, changes) => setCourses(prev => prev.map(c => c.id === courseId ? { ...c, categories: (c.categories || []).map(category => category.id === categoryId ? { ...category, grades: (category.grades || []).map(grade => grade.id === gradeId ? { ...grade, ...changes } : grade) } : category) } : c)), []);
  const deleteGrade = useCallback((courseId, categoryId, gradeId) => setCourses(prev => prev.map(c => c.id === courseId ? { ...c, categories: (c.categories || []).map(category => category.id === categoryId ? { ...category, grades: (category.grades || []).filter(grade => grade.id !== gradeId) } : category) } : c)), []);
  const addTask = useCallback((data) => {
    const item = { id: id('demo-task'), semesterId: semester.id, title: '', type: 'assignment', dueDate: '', dueTime: '23:59', priority: 'medium', completed: false, ...data };
    setTasks(prev => [...prev, item]); return item;
  }, []);
  const updateTask = useCallback((taskId, changes) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...changes } : t)), []);
  const toggleTaskComplete = useCallback((taskId) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t)), []);
  const addTimetableEntry = useCallback((data) => {
    const item = { id: id('demo-class'), semesterId: semester.id, ...data }; setTimetableEntries(prev => [...prev, item]); return item;
  }, []);
  const importFromOutline = useCallback((parsed) => {
    const found = courses.find(c => c.code === parsed.courseCode);
    if (found) {
      const freshTasks = (parsed.deadlines || []).filter(d => !tasks.some(t => t.courseId === found.id && t.title === d.title));
      freshTasks.forEach(d => addTask({ courseId: found.id, title: d.title, dueDate: d.date, type: d.type || 'assignment' }));
      updateCourse(found.id, { outlineUploaded: true }); return found;
    }
    return addCourse({ code: parsed.courseCode, name: parsed.courseName, professor: parsed.professor, outlineUploaded: true });
  }, [addCourse, addTask, courses, tasks, updateCourse]);
  const activeCourses = courses.filter(c => c.semesterId === semester.id);
  const activeTasks = tasks.filter(t => t.semesterId === semester.id);
  const value = useMemo(() => ({
    semesters: [semester], courses, tasks, timetableEntries, settings, studyHours, activeSemester: semester, activeCourses, activeTasks, activeTimetable: timetableEntries,
    isLoaded: true, syncError: null, isDemo: true, resetDemo,
    updateSettings, setStudentType: (studentType) => updateSettings({ studentType }), updateSchool: (school) => updateSettings({ school }), setCalendarSync: updateSettings,
    addSemester: () => semester, updateSemester: () => {}, deleteSemester: () => {}, setActiveSemester: () => {},
    addCourse, updateCourse, deleteCourse: (courseId) => setCourses(prev => prev.filter(c => c.id !== courseId)),
    addCategory, updateCategory, deleteCategory, addGrade, updateGrade, deleteGrade,
    addTimetableEntry, updateTimetableEntry: (entryId, changes) => setTimetableEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...changes } : e)), deleteTimetableEntry: (entryId) => setTimetableEntries(prev => prev.filter(e => e.id !== entryId)),
    addTask, updateTask, deleteTask: (taskId) => setTasks(prev => prev.filter(t => t.id !== taskId)), toggleTaskComplete, importFromOutline,
    addStudyTime: (courseId, seconds) => setStudyHours(prev => ({ ...prev, [courseId]: (prev[courseId] || 0) + seconds })), getStudyHours: (courseId) => studyHours[courseId] || 0,
  }), [activeCourses, activeTasks, addCategory, addCourse, addGrade, addTask, addTimetableEntry, courses, deleteCategory, deleteGrade, importFromOutline, resetDemo, settings, semester, studyHours, tasks, timetableEntries, toggleTaskComplete, updateCategory, updateCourse, updateGrade, updateSettings, updateTask]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
