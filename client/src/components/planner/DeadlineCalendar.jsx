import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-react';
import { generateCalendarMonth, today } from '../../utils/dateHelpers.js';
import { TASK_TYPE_COLORS } from '../../utils/colorHelpers.js';

const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DeadlineCalendar({ tasks, onSelectDay, selectedDay }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  // Collapsed by default on mobile: the calendar is dense at phone widths and
  // takes half the viewport before you scroll to the actual task list.
  const [openMobile, setOpenMobile] = useState(false);

  const weeks = generateCalendarMonth(year, month, tasks.filter(t => !t.completed));
  const monthName = new Date(year, month).toLocaleString('en-CA', { month: 'long', year: 'numeric' });

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="glass-card p-4">
      {/* Mobile summary trigger — tap to expand. On md+ the calendar is
          always open (this row hides). */}
      <button
        type="button"
        onClick={() => setOpenMobile(o => !o)}
        aria-expanded={openMobile}
        className="pressable md:hidden w-full flex items-center justify-between gap-2 -m-1 p-1"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Calendar size={15} className="text-primary" /> Calendar
          <span className="text-xs font-normal text-base-content/50">· {monthName}</span>
        </span>
        <ChevronDown size={16} className={`text-base-content/50 transition-transform duration-200 ${openMobile ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${openMobile ? 'block mt-3' : 'hidden'} md:block md:mt-0`}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prev} className="btn btn-ghost btn-xs btn-circle pressable hit-44" aria-label="Previous month"><ChevronLeft size={14} /></button>
          <span className="text-sm font-semibold">{monthName}</span>
          <button onClick={next} className="btn btn-ghost btn-xs btn-circle pressable hit-44" aria-label="Next month"><ChevronRight size={14} /></button>
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
                className={`pressable hit-44 aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs transition-colors relative
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
    </div>
  );
}
