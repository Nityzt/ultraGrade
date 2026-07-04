import { useApp } from '../../context/AppContext';
import { formatTime } from '../../utils/dateHelpers';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TodaysScheduleWidget() {
  const { activeTimetable, activeCourses } = useApp();
  const courseMap = Object.fromEntries(activeCourses.map(c => [c.id, c]));

  const todayDow = new Date().getDay();
  const todays = activeTimetable
    .filter(e => e.dayOfWeek === todayDow)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="glass-card glass-hover h-full p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-base-content/45">Today's Schedule</h3>
        <Link to="/timetable" className="text-[11px] text-primary hover:text-primary/70 font-medium">Timetable →</Link>
      </div>

      {todays.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-base-content/40 text-sm py-8">
          Nothing scheduled today
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {todays.map((entry, idx) => {
            const course = courseMap[entry.courseId];
            const color = entry.color || course?.color || 'hsl(var(--p))';
            const [sh, sm] = entry.startTime.split(':').map(Number);
            const [eh, em] = entry.endTime.split(':').map(Number);
            const startMins = sh * 60 + sm;
            const endMins = eh * 60 + em;
            const isNow = nowMins >= startMins && nowMins < endMins;
            const isPast = nowMins >= endMins;
            const isLast = idx === todays.length - 1;

            return (
              <li key={entry.id} className={`relative flex gap-4 ${isPast && !isNow ? 'opacity-45' : ''}`}>
                {/* timeline rail */}
                <div className="relative flex flex-col items-center w-6 shrink-0">
                  {!isLast && <span className="absolute top-7 bottom-0 w-px bg-base-content/12" />}
                  <span
                    className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center border z-10 ${
                      isNow ? 'bg-primary/20 border-primary' : 'bg-base-content/5 border-base-content/15'
                    }`}
                    style={isNow ? { boxShadow: '0 0 14px hsl(var(--p) / 0.4)' } : undefined}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isNow ? 'bg-primary bloom-dot text-primary' : 'bg-base-content/40'}`}
                    />
                  </span>
                </div>

                {/* content */}
                <div className="flex-1 min-w-0 pb-5">
                  <div className={`text-[11px] font-semibold mb-0.5 ${isNow ? 'text-primary glow-sage' : 'text-base-content/50'}`}>
                    {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                    {isNow && <span className="ml-2 uppercase tracking-wide">· Now</span>}
                  </div>
                  <div className="text-sm font-semibold text-base-content truncate flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {entry.label}
                  </div>
                  {entry.location && (
                    <div className="text-xs text-base-content/45 mt-1 flex items-center gap-1">
                      <MapPin size={12} /> {entry.location}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
