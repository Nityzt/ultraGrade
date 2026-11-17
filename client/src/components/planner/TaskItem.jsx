import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { getUrgency, formatDateTime } from '../../utils/dateHelpers.js';
import { TASK_TYPE_BADGES } from '../../utils/colorHelpers.js';
import { useApp } from '../../context/AppContext.jsx';
import { EASE } from '../../lib/motion.js';

const GRADABLE_TYPES = new Set(['exam', 'quiz', 'assignment', 'project']);

// Hold the ticked state on screen for a beat before the task actually moves to
// Completed — commit immediately and the row vanishes mid-click, which reads
// as a glitch rather than an acknowledgement. Clicking again within the hold
// cancels (undo before commit).
const COMPLETE_HOLD_MS = 500;

export default function TaskItem({ task, onEdit, onDelete }) {
  const { toggleTaskComplete, courses } = useApp();
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === task.courseId);
  const urgency = getUrgency(task);

  // On completing (not un-completing) a gradable, course-linked task, offer a
  // one-tap shortcut to log the grade — the natural next step.
  const maybeNotifyGradeable = () => {
    if (GRADABLE_TYPES.has(task.type) && task.courseId) {
      toast('Task completed', {
        action: { label: 'Log grade', onClick: () => navigate('/grades?grade=' + task.id) },
      });
    }
  };

  const [pending, setPending] = useState(false);
  const holdTimer = useRef(null);
  const toggleRef = useRef(toggleTaskComplete);
  toggleRef.current = toggleTaskComplete;
  // If the row unmounts mid-hold (filter change, list re-render), commit the
  // completion immediately rather than silently dropping the user's tick.
  useEffect(() => () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); toggleRef.current(task.id); }
  }, [task.id]);
  const done = task.completed || pending;

  const handleToggle = () => {
    if (task.completed) { toggleTaskComplete(task.id); return; }
    if (reduce) { toggleTaskComplete(task.id); maybeNotifyGradeable(); return; }
    if (pending) { clearTimeout(holdTimer.current); holdTimer.current = null; setPending(false); return; }
    setPending(true);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      toggleTaskComplete(task.id);
      maybeNotifyGradeable();
    }, COMPLETE_HOLD_MS);
  };

  const urgencyBg = {
    overdue: 'border-l-error',
    critical: 'border-l-warning',
    today: 'border-l-info',
    soon: 'border-l-primary',
  }[urgency] || 'border-l-transparent';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      // Fade out first, then collapse the row's space — animating height while
      // still visible squishes the text and reads as jitter. Margin collapses
      // with the height (it lives on this element, so nothing snaps at unmount).
      exit={{
        opacity: 0,
        height: 0,
        marginBottom: 0,
        transition: {
          opacity: { duration: 0.12, ease: EASE },
          default: { duration: 0.22, ease: EASE, delay: 0.08 },
        },
      }}
      transition={{ duration: 0.25, ease: EASE }}
      style={{ overflow: 'hidden' }}
      className={`flex items-start gap-3 p-3.5 mb-2 surface border-l-4 group ${urgencyBg} transition-opacity duration-300 ${done ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        aria-pressed={done}
        aria-label={done ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors duration-200 ${
          done ? 'bg-success border-success' : 'border-base-content/30 hover:border-primary'
        }`}
      >
        {done && (
          <motion.svg
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          >
            <motion.path
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: EASE, delay: 0.05 }}
              strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
            />
          </motion.svg>
        )}
      </motion.button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium text-base-content transition-opacity duration-300 ${done ? 'line-through opacity-60' : ''}`}>{task.title}</p>
          <div className="touch-visible flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle pressable hit-44" aria-label={`Edit task "${task.title}"`}><Pencil size={12} /></button>
            <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle pressable text-error hit-44" aria-label={`Delete task "${task.title}"`}><Trash2 size={12} /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`badge badge-xs ${TASK_TYPE_BADGES[task.type] || 'badge-ghost'}`}>{task.type}</span>
          {course && (
            <Link
              to={'/grades?course=' + course.id}
              onClick={(e) => e.stopPropagation()}
              className="badge badge-xs badge-ghost hover:underline"
              style={{ borderColor: course.color, color: course.color }}
            >
              {course.code}
            </Link>
          )}
          <span className="flex items-center gap-0.5 text-xs text-base-content/50">
            <Clock size={10} />
            {formatDateTime(task.dueDate, task.dueTime)}
          </span>
          {urgency === 'overdue' && !task.completed && <span className="badge badge-xs badge-error">Overdue</span>}
          {urgency === 'today' && !task.completed && <span className="badge badge-xs badge-info">Due Today</span>}
        </div>
      </div>
    </motion.div>
  );
}
