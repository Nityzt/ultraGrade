import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Sparkles, Loader, AlertCircle, CornerDownLeft,
  CheckSquare, GraduationCap, CalendarClock, X,
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { API_BASE_URL } from '../../lib/apiBase.js';
import { randomCourseColor } from '../../utils/colorHelpers.js';
import { dayFullName } from '../../utils/dateHelpers.js';

/**
 * Natural-language quick-add ("essay due next fri 20%" → a dated task on the
 * right course). Opens with ⌘K / Ctrl-K, or the floating button (touch).
 * Posts to the JWT-protected /api/quick-add, previews the parsed result, then
 * commits through existing AppContext actions (addTask/addGrade/addTimetableEntry).
 */
export default function QuickAddBar() {
  const {
    addTask, addTimetableEntry, addGrade,
    activeCourses, courses, activeSemester,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | preview | error
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  // Global ⌘K / Ctrl-K to open.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const reset = useCallback(() => {
    setText(''); setStatus('idle'); setParsed(null); setError('');
  }, []);

  const close = useCallback(() => { setOpen(false); reset(); }, [reset]);

  useEffect(() => {
    if (open && status === 'idle') {
      // focus after the modal mounts
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, status]);

  const submit = async () => {
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
  };

  const course = parsed?.courseId ? courses.find((c) => c.id === parsed.courseId) : null;

  // For a grade, resolve the target category by name (case-insensitive).
  const gradeCategory =
    parsed?.kind === 'grade' && course
      ? (course.categories || []).find(
          (cat) => cat.name.toLowerCase() === (parsed.category || '').toLowerCase()
        )
      : null;

  const commit = () => {
    if (!parsed) return;
    if (parsed.kind === 'task') {
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
    close();
  };

  const canCommit = parsed && !(parsed.kind === 'grade' && !gradeCategory);

  return (
    <>
      {/* Floating trigger (discoverable on touch; keyboard users get ⌘K). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick add (Command K)"
        className="fixed z-30 bottom-24 md:bottom-6 right-5 md:right-6 btn btn-primary rounded-full shadow-bloom gap-2 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--bloom-color,rgba(181,205,183,0.4))] active:scale-95"
      >
        <Sparkles size={16} />
        <span className="hidden sm:inline">Quick add</span>
        <kbd className="hidden md:inline text-[10px] font-mono opacity-70 border border-primary-content/30 rounded px-1">⌘K</kbd>
      </button>

      <Modal isOpen={open} onClose={close} title="Quick add" size="md">
        {status !== 'preview' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100/50 px-3 focus-within:border-primary transition-colors">
              <Sparkles size={18} className="text-primary shrink-0" />
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => { setText(e.target.value); if (status === 'error') setStatus('idle'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && status !== 'loading') submit(); }}
                placeholder="e.g. essay due next friday 20%  ·  got 85 on cs350 midterm  ·  lab mondays 2-4pm"
                className="input w-full bg-transparent border-0 focus:outline-none px-1"
                aria-label="Describe what to add"
                disabled={status === 'loading'}
              />
              {status === 'loading'
                ? <Loader size={16} className="text-primary animate-spin shrink-0" />
                : <CornerDownLeft size={15} className="text-base-content/30 shrink-0" />}
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 text-error text-sm px-1">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-base-content/40 px-1">
              Type a task, a grade, or a class in plain English — AI figures out the rest and matches your course.
            </p>
          </div>
        )}

        {status === 'preview' && parsed && (
          <QuickAddPreview
            parsed={parsed}
            course={course}
            gradeCategory={gradeCategory}
            canCommit={canCommit}
            onBack={reset}
            onCommit={commit}
          />
        )}
      </Modal>
    </>
  );
}

const KIND_META = {
  task: { icon: CheckSquare, label: 'Task', accent: 'text-primary' },
  grade: { icon: GraduationCap, label: 'Grade', accent: 'text-success' },
  class: { icon: CalendarClock, label: 'Class', accent: 'text-info' },
};

function Row({ k, v }) {
  if (v === undefined || v === null || v === '') return null;
  return (
    <div className="flex justify-between gap-4 text-sm py-1">
      <span className="text-base-content/50">{k}</span>
      <span className="font-medium text-right truncate">{v}</span>
    </div>
  );
}

function QuickAddPreview({ parsed, course, gradeCategory, canCommit, onBack, onCommit }) {
  const meta = KIND_META[parsed.kind] || KIND_META.task;
  const Icon = meta.icon;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon size={18} className={meta.accent} />
        <span className="font-semibold">{meta.label}</span>
        {course && (
          <span className="pill px-2.5 py-0.5 text-xs text-base-content/70">{course.code || course.name}</span>
        )}
      </div>

      <div className="pill rounded-2xl px-4 py-2">
        {parsed.kind === 'task' && (
          <>
            <Row k="Title" v={parsed.title} />
            <Row k="Type" v={parsed.taskType} />
            <Row k="Due" v={parsed.dueDate ? `${parsed.dueDate}${parsed.dueTime && parsed.dueTime !== '23:59' ? ` · ${parsed.dueTime}` : ''}` : 'No date'} />
            <Row k="Priority" v={parsed.priority} />
          </>
        )}
        {parsed.kind === 'grade' && (
          <>
            <Row k="Category" v={parsed.category} />
            <Row k="Score" v={parsed.score !== undefined ? `${parsed.score} / ${parsed.maxScore}` : undefined} />
            {parsed.label && <Row k="Label" v={parsed.label} />}
          </>
        )}
        {parsed.kind === 'class' && (
          <>
            <Row k="Day" v={parsed.dayOfWeek !== undefined ? dayFullName(parsed.dayOfWeek) : undefined} />
            <Row k="Time" v={parsed.startTime ? `${parsed.startTime} – ${parsed.endTime}` : undefined} />
            <Row k="Type" v={parsed.classType} />
            <Row k="Location" v={parsed.location} />
          </>
        )}
      </div>

      {parsed.kind === 'grade' && !gradeCategory && (
        <p className="text-xs text-warning/90 flex items-start gap-1.5 px-1">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {course
            ? `No category named "${parsed.category || '—'}" in ${course.code || course.name}. Add that category on the course first, then re-add this grade.`
            : 'Could not match a course for this grade. Mention the course code (e.g. "cs350") and try again.'}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="btn btn-ghost flex-1 gap-1.5">
          <X size={15} /> Edit
        </button>
        <button onClick={onCommit} disabled={!canCommit} className="btn btn-primary flex-1">
          Add to ultraGrade
        </button>
      </div>
    </div>
  );
}
