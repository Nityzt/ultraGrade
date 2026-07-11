import { motion } from 'framer-motion';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { getUrgency, formatDateTime } from '../../utils/dateHelpers.js';
import { TASK_TYPE_BADGES, TASK_TYPE_COLORS } from '../../utils/colorHelpers.js';
import { useApp } from '../../context/AppContext.jsx';

export default function TaskItem({ task, onEdit, onDelete }) {
  const { toggleTaskComplete, courses } = useApp();
  const course = courses.find(c => c.id === task.courseId);
  const urgency = getUrgency(task);

  const urgencyBg = {
    overdue: 'border-l-error',
    critical: 'border-l-warning',
    today: 'border-l-info',
    soon: 'border-l-primary',
  }[urgency] || 'border-l-transparent';

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={`flex items-start gap-3 p-3.5 glass-card border-l-4 group ${urgencyBg} ${task.completed ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => toggleTaskComplete(task.id)}
        aria-pressed={task.completed}
        aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          task.completed ? 'bg-success border-success' : 'border-base-content/30 hover:border-primary'
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </motion.button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium text-base-content ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</p>
          <div className="touch-visible flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle pressable hit-44" aria-label={`Edit task "${task.title}"`}><Pencil size={12} /></button>
            <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle pressable text-error hit-44" aria-label={`Delete task "${task.title}"`}><Trash2 size={12} /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`badge badge-xs ${TASK_TYPE_BADGES[task.type] || 'badge-ghost'}`}>{task.type}</span>
          {course && (
            <span className="badge badge-xs badge-ghost" style={{ borderColor: course.color, color: course.color }}>
              {course.code}
            </span>
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
