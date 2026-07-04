import { useApp } from '../../context/AppContext';
import { getUrgency, formatDate, daysBetween, today } from '../../utils/dateHelpers';
import { FileText, GraduationCap, HelpCircle, FlaskConical, User, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_ICON = {
  assignment: FileText,
  exam: GraduationCap,
  quiz: HelpCircle,
  project: FlaskConical,
  personal: User,
};

// urgency → chip color (bg / text tokens)
const URGENCY_STYLE = {
  overdue: 'bg-error/12 text-error border-error/20',
  today: 'bg-warning/12 text-warning border-warning/20',
  critical: 'bg-warning/12 text-warning border-warning/20',
  soon: 'bg-info/12 text-info border-info/20',
  upcoming: 'bg-primary/12 text-primary border-primary/20',
  later: 'bg-base-content/8 text-base-content/50 border-base-content/10',
  done: 'bg-primary/10 text-primary/60 border-primary/15',
};

function dueLabel(daysLeft) {
  if (daysLeft < 0) return { text: 'Overdue', cls: 'text-error' };
  if (daysLeft === 0) return { text: 'Due today', cls: 'text-warning' };
  if (daysLeft === 1) return { text: 'Due tomorrow', cls: 'text-warning' };
  if (daysLeft <= 3) return { text: `In ${daysLeft} days`, cls: 'text-base-content/50' };
  return { text: `In ${daysLeft} days`, cls: 'text-base-content/45' };
}

export default function UpcomingDeadlinesWidget() {
  const { activeTasks, activeCourses } = useApp();
  const courseMap = Object.fromEntries(activeCourses.map(c => [c.id, c]));

  const upcoming = activeTasks
    .filter(t => !t.completed && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <div className="glass-card glass-hover h-full p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-base-content/45">Deadlines</h3>
        <Link to="/planner" className="text-[11px] text-primary hover:text-primary/70 font-medium">View all →</Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-base-content/40 text-sm py-8 gap-2">
          <CalendarClock size={26} className="text-base-content/25" />
          You're all caught up
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {upcoming.map(task => {
            const urgency = getUrgency(task);
            const course = courseMap[task.courseId];
            const daysLeft = daysBetween(today(), task.dueDate);
            const Icon = TYPE_ICON[task.type] || FileText;
            const due = dueLabel(daysLeft);
            return (
              <li key={task.id} className="flex items-center gap-3.5 rounded-2xl px-2 py-1.5 hover:bg-base-content/5 transition-colors">
                <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${URGENCY_STYLE[urgency] || URGENCY_STYLE.later}`}>
                  <Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-base-content truncate">{task.title}</div>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    {course && <span className="font-semibold truncate" style={{ color: course.color }}>{course.code}</span>}
                    <span className={due.cls}>{due.text}</span>
                    <span className="text-base-content/30">· {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
