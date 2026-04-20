import { useApp } from '../../context/AppContext';
import { getUrgency, formatDate, daysBetween, today } from '../../utils/dateHelpers';
import { TASK_TYPE_BADGES } from '../../utils/colorHelpers';
import { CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';

const URGENCY_DOT = {
  overdue: 'bg-error',
  today: 'bg-warning',
  critical: 'bg-warning',
  soon: 'bg-info',
  upcoming: 'bg-success',
  later: 'bg-base-content/30',
  done: 'bg-success/50',
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
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalendarClock size={16} className="text-primary" /> Upcoming Deadlines
          </h3>
          <Link to="/planner" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-4 text-base-content/50 text-sm">No upcoming deadlines</div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map(task => {
              const urgency = getUrgency(task);
              const course = courseMap[task.courseId];
              const daysLeft = daysBetween(today(), task.dueDate);
              return (
                <li key={task.id} className="flex items-start gap-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${URGENCY_DOT[urgency] || 'bg-base-content/30'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="flex items-center gap-2 text-xs text-base-content/60 flex-wrap">
                      {course && <span style={{ color: course.color }} className="font-medium">{course.code}</span>}
                      <span>{formatDate(task.dueDate)}</span>
                      {daysLeft < 0 && <span className="text-error font-semibold">Overdue</span>}
                      {daysLeft === 0 && <span className="text-warning font-semibold">Today</span>}
                      {daysLeft > 0 && daysLeft <= 3 && <span className="text-warning">{daysLeft}d left</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${TASK_TYPE_BADGES[task.type] || 'badge-ghost'}`}>
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
