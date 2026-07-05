import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarMonth, today } from '../../utils/dateHelpers.js';
import { TASK_TYPE_COLORS } from '../../utils/colorHelpers.js';

const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DeadlineCalendar({ tasks, onSelectDay, selectedDay }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const weeks = generateCalendarMonth(year, month, tasks.filter(t => !t.completed));
  const monthName = new Date(year, month).toLocaleString('en-CA', { month: 'long', year: 'numeric' });

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="btn btn-ghost btn-xs btn-circle"><ChevronLeft size={14} /></button>
        <span className="text-sm font-semibold">{monthName}</span>
        <button onClick={next} className="btn btn-ghost btn-xs btn-circle"><ChevronRight size={14} /></button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_HEADER.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-base-content/40">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0.5">
          {week.map(day => (
            <button
              key={day.date}
              onClick={() => onSelectDay(day.date === selectedDay ? null : day.date)}
              className={`aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs transition-colors relative
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
                ${day.isToday ? 'bg-primary/20 text-primary font-bold' : ''}
                ${selectedDay === day.date ? 'ring-2 ring-primary' : ''}
                ${day.tasks.length > 0 && !day.isToday ? 'bg-base-300/40' : ''}
                hover:bg-base-300/60
              `}
            >
              {day.day}
              {day.tasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {day.tasks.slice(0, 3).map((t, i) => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: TASK_TYPE_COLORS[t.type] || '#94a3b8' }} />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
