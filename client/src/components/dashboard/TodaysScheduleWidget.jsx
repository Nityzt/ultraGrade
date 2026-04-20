import { useApp } from '../../context/AppContext';
import { formatTime } from '../../utils/dateHelpers';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TodaysScheduleWidget() {
  const { activeTimetable, activeCourses } = useApp();
  const courseMap = Object.fromEntries(activeCourses.map(c => [c.id, c]));

  const todayDow = new Date().getDay(); // 0=Sun
  const todays = activeTimetable
    .filter(e => e.dayOfWeek === todayDow)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="card bg-base-200 shadow-sm h-full">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Today's Schedule
          </h3>
          <Link to="/timetable" className="text-xs text-primary hover:underline">Full view</Link>
        </div>
        {todays.length === 0 ? (
          <div className="text-center py-4 text-base-content/50 text-sm">No classes today</div>
        ) : (
          <ul className="space-y-2">
            {todays.map(entry => {
              const course = courseMap[entry.courseId];
              const color = entry.color || course?.color || '#818cf8';
              const [sh, sm] = entry.startTime.split(':').map(Number);
              const [eh, em] = entry.endTime.split(':').map(Number);
              const startMins = sh * 60 + sm;
              const endMins = eh * 60 + em;
              const isNow = nowMins >= startMins && nowMins < endMins;
              const isPast = nowMins >= endMins;
              return (
                <li key={entry.id} className={`flex gap-3 items-start rounded-lg p-2 ${isNow ? 'bg-primary/10 ring-1 ring-primary/30' : ''} ${isPast ? 'opacity-50' : ''}`}>
                  <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{entry.label}</div>
                    <div className="text-xs text-base-content/60">
                      {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                      {entry.location && <span> · {entry.location}</span>}
                    </div>
                  </div>
                  {isNow && <span className="badge badge-primary badge-xs">Now</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
