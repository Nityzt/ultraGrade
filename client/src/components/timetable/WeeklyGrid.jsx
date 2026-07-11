import { useState, useMemo } from 'react';
import ClassBlock from './ClassBlock.jsx';
import { timeToMinutes } from '../../utils/dateHelpers.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_NUMS = [1, 2, 3, 4, 5];
const SLOT_MINS = 30;
const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * (60 / SLOT_MINS);

function timeToSlot(timeStr) {
  const mins = timeToMinutes(timeStr);
  return Math.floor((mins - START_HOUR * 60) / SLOT_MINS);
}

function detectOverlaps(entries) {
  // Group entries by day and detect overlapping groups
  const byDay = {};
  for (const e of entries) {
    if (!byDay[e.dayOfWeek]) byDay[e.dayOfWeek] = [];
    byDay[e.dayOfWeek].push(e);
  }
  const layout = {};
  for (const [day, dayEntries] of Object.entries(byDay)) {
    const sorted = [...dayEntries].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    // Simple overlap detection: compare each entry against all previous
    const cols = []; // cols[i] = end minute of the last entry in column i
    const entryCol = {};
    for (const entry of sorted) {
      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);
      let placed = false;
      for (let col = 0; col < cols.length; col++) {
        if (cols[col] <= start) { entryCol[entry.id] = { col, totalCols: null }; cols[col] = end; placed = true; break; }
      }
      if (!placed) { entryCol[entry.id] = { col: cols.length, totalCols: null }; cols.push(end); }
    }
    const totalCols = cols.length;
    for (const entry of sorted) {
      if (entryCol[entry.id]) entryCol[entry.id].totalCols = totalCols;
    }
    Object.assign(layout, entryCol);
  }
  return layout;
}

export default function WeeklyGrid({ entries, onClickEntry, onClickSlot }) {
  const layout = useMemo(() => detectOverlaps(entries), [entries]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="overflow-auto">
      {/* At sm the layout compresses into ~544px so iPad portrait (768) fits
          without horizontal scroll; below sm we keep the min-width so it
          scrolls horizontally instead of squishing to unreadable. */}
      <div className="min-w-[540px] sm:min-w-0">
        {/* Day headers */}
        <div className="grid sticky top-0 z-10 bg-base-100 border-b border-base-300" style={{ gridTemplateColumns: '40px repeat(5, 1fr)' }}>
          <div />
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-base-content/60 border-l border-base-300">{d}</div>
          ))}
        </div>

        {/* Grid body */}
        <div className="relative grid" style={{ gridTemplateColumns: '40px repeat(5, 1fr)', gridTemplateRows: `repeat(${TOTAL_SLOTS}, 28px)` }}>
          {/* Time labels */}
          {hours.map(hour => (
            <div key={hour}
              className="text-right pr-2 text-[10px] text-base-content/40 leading-none"
              style={{ gridRow: `${(hour - START_HOUR) * 2 + 1} / span 1`, gridColumn: 1, paddingTop: '6px' }}
            >
              {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'am' : 'pm'}
            </div>
          ))}

          {/* Hour dividers */}
          {hours.map(hour => (
            DAY_NUMS.map((_, dIdx) => (
              <div key={`${hour}-${dIdx}`}
                className="border-l border-t border-base-300/40"
                style={{ gridRow: `${(hour - START_HOUR) * 2 + 1}`, gridColumn: dIdx + 2 }}
              />
            ))
          ))}

          {/* Half-hour dividers */}
          {hours.map(hour => (
            DAY_NUMS.map((_, dIdx) => (
              <div key={`half-${hour}-${dIdx}`}
                className="border-l border-base-300/20"
                style={{ gridRow: `${(hour - START_HOUR) * 2 + 2}`, gridColumn: dIdx + 2 }}
              />
            ))
          ))}

          {/* Clickable empty slots */}
          {DAY_NUMS.map((day, dIdx) =>
            Array.from({ length: TOTAL_SLOTS }, (_, slot) => (
              <div key={`slot-${day}-${slot}`}
                className="cursor-pointer hover:bg-primary/5 transition-colors"
                style={{ gridRow: slot + 1, gridColumn: dIdx + 2 }}
                onClick={() => {
                  const mins = START_HOUR * 60 + slot * SLOT_MINS;
                  const h = Math.floor(mins / 60), m = mins % 60;
                  onClickSlot?.(day, `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
                }}
              />
            ))
          )}

          {/* Entries */}
          {entries.map(entry => {
            const dayIdx = DAY_NUMS.indexOf(entry.dayOfWeek);
            if (dayIdx === -1) return null;
            const startSlot = timeToSlot(entry.startTime);
            const endSlot = timeToSlot(entry.endTime);
            const span = Math.max(endSlot - startSlot, 1);
            const { col = 0, totalCols = 1 } = layout[entry.id] || {};
            const colWidth = 100 / totalCols;

            return (
              <div
                key={entry.id}
                style={{
                  gridRow: `${startSlot + 1} / span ${span}`,
                  gridColumn: dayIdx + 2,
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <ClassBlock
                  entry={entry}
                  style={{
                    left: `${col * colWidth + 1}%`,
                    width: `${colWidth - 2}%`,
                    top: '2px',
                    bottom: '2px'
                  }}
                  onClick={() => onClickEntry?.(entry)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
