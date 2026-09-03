import { AnimatePresence, motion } from 'framer-motion';
import TaskItem from './TaskItem.jsx';
import { getUrgency, today } from '../../utils/dateHelpers.js';
import { addDays } from '../../utils/dateHelpers.js';

function Section({ label, tasks, onEdit, onDelete, defaultOpen = true }) {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-2 px-1">{label} ({tasks.length})</h4>
      {/* TaskItem must be the direct keyed child — AnimatePresence tracks exits
          by child key, and the row's own margin/height collapse in one motion. */}
      <AnimatePresence initial={false}>
        {tasks.map(t => (
          <TaskItem key={t.id} task={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function TaskList({ tasks, onEdit, onDelete }) {
  const overdue = tasks.filter(t => !t.completed && getUrgency(t) === 'overdue');
  const todayTasks = tasks.filter(t => !t.completed && (getUrgency(t) === 'today' || getUrgency(t) === 'critical'));
  const week = tasks.filter(t => !t.completed && (getUrgency(t) === 'soon' || getUrgency(t) === 'upcoming'));
  const later = tasks.filter(t => !t.completed && getUrgency(t) === 'later');
  const done = tasks.filter(t => t.completed);

  return (
    <div>
      <Section label="Overdue" tasks={overdue} onEdit={onEdit} onDelete={onDelete} />
      <Section label="Today & Tomorrow" tasks={todayTasks} onEdit={onEdit} onDelete={onDelete} />
      <Section label="This Week" tasks={week} onEdit={onEdit} onDelete={onDelete} />
      <Section label="Later" tasks={later} onEdit={onEdit} onDelete={onDelete} />
      {done.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs font-semibold text-base-content/30 uppercase tracking-wider cursor-pointer hover:text-base-content/50 transition-colors">
            Completed ({done.length})
          </summary>
          <div className="mt-2">
            <AnimatePresence initial={false}>
              {done.map(t => (
                <TaskItem key={t.id} task={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} />
              ))}
            </AnimatePresence>
          </div>
        </details>
      )}
    </div>
  );
}
