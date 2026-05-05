import { useApp } from '../../context/AppContext';
import { getUrgency, formatDate, daysBetween, today } from '../../utils/dateHelpers';
import { TASK_TYPE_BADGES } from '../../utils/colorHelpers';
import { CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';

const URGENCY_BORDER = {
  overdue: 'border-l-error',
  today: 'border-l-warning',
  critical: 'border-l-warning',
  soon: 'border-l-info',
  upcoming: 'border-l-success',
  later: 'border-l-base-content/20',
  done: 'border-l-success/30',
};

const URGENCY_BG = {
  overdue: 'bg-error/5',
  today: 'bg-warning/5',
  critical: 'bg-warning/5',
};

export default function UpcomingDeadlinesWidget() {
  const { activeTasks, activeCourses } = useApp();
  const courseMap = Object.fromEntries(activeCourses.map(c => [c.id, c]));

  const upcoming = activeTasks
    .filter(t => !t.completed && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <div className="card bg-base-200 shadow-sm h-full">
      <div className="card-body p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalendarClock size={16} className="text-primary" /> Upcoming Deadlines
          </h3>
          <Link to="/planner" className="text-xs text-primary hover:text-primary/70 font-medium">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-6 text-base-content/40 text-sm">No upcoming deadlines 🎉</div>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map(task => {
              const urgency = getUrgency(task);
              const course = courseMap[task.courseId];
              const daysLeft = daysBetween(today(), task.dueDate);
              return (
                <li
                  key={task.id}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border-l-2 hover:bg-base-300/30 transition-colors ${URGENCY_BORDER[urgency] || 'border-l-base-content/20'} ${URGENCY_BG[urgency] || ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="flex items-center gap-2 text-xs text-base-content/50 flex-wrap mt-0.5">
                      {course && (
                        <span className="font-semibold" style={{ color: course.color }}>{course.code}</span>
                      )}
                      <span>{formatDate(task.dueDate)}</span>
                      {daysLeft < 0 && <span className="text-error font-semibold">Overdue</span>}
                      {daysLeft === 0 && <span className="text-warning font-semibold">Today</span>}
                      {daysLeft > 0 && daysLeft <= 3 && <span className="text-warning">{daysLeft}d left</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${TASK_TYPE_BADGES[task.type] || 'badge-ghost'}`}>
                    {task.type}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
