import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  Sparkles, Loader, AlertCircle, CornerDownLeft, CheckSquare, GraduationCap,
  CalendarClock, X, LayoutDashboard, Calendar, ClipboardList, Globe, BookOpen,
  Settings as SettingsIcon, Download, Plus, Check,
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useThemeTransition } from '../../hooks/useThemeTransition.js';
import { useQuickAdd } from './useQuickAdd.js';
import { dayFullName } from '../../utils/dateHelpers.js';

/**
 * Unified ⌘K palette: free-text AI quick-add (task/grade/class, via
 * useQuickAdd) folded in as the top row alongside filterable page navigation
 * and app-wide actions. Replaces the old standalone QuickAddBar — the AI row
 * is given `value={text}` so it always self-matches (score 1) and floats to
 * the top whenever the input is non-empty, letting Enter submit it by
 * default exactly like the old plain-input flow.
 */
export default function CommandPalette() {
  const navigate = useNavigate();
  const { activeCourses, semesters, activeSemester, setActiveSemester, settings } = useApp();
  const { meta, nextMeta, toggle } = useThemeTransition();
  const quickAdd = useQuickAdd();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
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

  const close = useCallback(() => {
    setOpen(false);
    setText('');
    quickAdd.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open && quickAdd.status === 'idle') {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, quickAdd.status]);

  const go = (path) => { navigate(path); close(); };

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
        {quickAdd.status === 'preview' && quickAdd.parsed ? (
          <QuickAddPreview
            parsed={quickAdd.parsed}
            course={quickAdd.course}
            gradeCategory={quickAdd.gradeCategory}
            canCommit={quickAdd.canCommit}
            onBack={quickAdd.reset}
            onCommit={() => { quickAdd.commit(); close(); }}
          />
        ) : (
          <Command shouldFilter loop label="Quick add and command palette" className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100/50 px-3 focus-within:border-primary transition-colors">
              <Sparkles size={18} className="text-primary shrink-0" />
              <Command.Input
                ref={inputRef}
                value={text}
                onValueChange={(v) => { setText(v); if (quickAdd.status === 'error') quickAdd.reset(); }}
                placeholder="e.g. essay due next friday 20%  ·  or jump to a page, add a course…"
                className="input w-full bg-transparent border-0 focus:outline-none px-1"
                aria-label="Search or describe what to add"
                disabled={quickAdd.status === 'loading'}
              />
              {quickAdd.status === 'loading'
                ? <Loader size={16} className="text-primary animate-spin shrink-0" />
                : <CornerDownLeft size={15} className="text-base-content/30 shrink-0" />}
            </div>

            {quickAdd.status === 'error' && (
              <div className="flex items-start gap-2 text-error text-sm px-1">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{quickAdd.error}</span>
              </div>
            )}

            {quickAdd.status !== 'loading' && (
              <Command.List className="max-h-[50vh] overflow-y-auto -mx-1 px-1">
                <Command.Empty className="text-sm text-base-content/40 text-center py-6">
                  No results found.
                </Command.Empty>

                {text.trim() && (
                  <Command.Item
                    value={text}
                    onSelect={() => quickAdd.submit(text)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer aria-selected:bg-primary/12 aria-selected:text-primary"
                  >
                    <Sparkles size={15} className="shrink-0 text-primary" />
                    <span className="truncate">Quick-add with AI: <span className="font-medium">"{text}"</span></span>
                  </Command.Item>
                )}

                <Command.Group heading="Navigate" className={GROUP_CLASS}>
                  <PaletteItem icon={LayoutDashboard} label="Dashboard" onSelect={() => go('/')} />
                  <PaletteItem icon={GraduationCap} label="Grades" onSelect={() => go('/grades')} />
                  <PaletteItem icon={Calendar} label="Timetable" onSelect={() => go('/timetable')} />
                  <PaletteItem icon={ClipboardList} label="Planner" onSelect={() => go('/planner')} />
                  {settings.studentType === 'international'
                    ? <PaletteItem icon={Globe} label="Immigration" onSelect={() => go('/immigration')} />
                    : <PaletteItem icon={BookOpen} label="Student Resources" onSelect={() => go('/resources')} />}
                  <PaletteItem icon={SettingsIcon} label="Settings" onSelect={() => go('/settings')} />
                </Command.Group>

                <Command.Group heading="Actions" className={GROUP_CLASS}>
                  <PaletteItem icon={Plus} label="Add course" onSelect={() => go('/grades?new=course')} />
                  <PaletteItem icon={Plus} label="Add task" onSelect={() => go('/planner?new=task')} />
                  {activeCourses.length > 0 && (
                    <PaletteItem icon={Download} label="Export PDF" onSelect={() => go('/grades?export=1')} />
                  )}
                  <PaletteItem
                    icon={nextMeta.Icon}
                    label={`Switch theme (${meta.label} → ${nextMeta.label})`}
                    onSelect={() => { toggle(); close(); }}
                  />
                </Command.Group>

                {semesters.length > 1 && (
                  <Command.Group heading="Switch semester" className={GROUP_CLASS}>
                    {semesters.map((s) => (
                      <PaletteItem
                        key={s.id}
                        icon={s.id === activeSemester?.id ? Check : Calendar}
                        label={s.name}
                        onSelect={() => { setActiveSemester(s.id); close(); }}
                      />
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            )}
          </Command>
        )}
      </Modal>
    </>
  );
}

function PaletteItem({ icon: Icon, label, onSelect }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer aria-selected:bg-primary/12 aria-selected:text-primary"
    >
      <Icon size={15} className="shrink-0 text-base-content/60" />
      <span className="truncate">{label}</span>
    </Command.Item>
  );
}

const GROUP_CLASS =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 ' +
  '[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold ' +
  '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide ' +
  '[&_[cmdk-group-heading]]:text-base-content/40';

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
