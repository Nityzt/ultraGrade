import { Pencil, Trash2, MapPin, User } from 'lucide-react';
import { formatTime } from '../../utils/dateHelpers.js';
import { colorWithOpacity } from '../../utils/colorHelpers.js';
import { useApp } from '../../context/AppContext.jsx';

export default function DayView({ entries, onEdit }) {
  const { deleteTimetableEntry } = useApp();
  const sorted = [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-base-content/40 text-sm">No classes today</p>
        <p className="text-base-content/30 text-xs mt-1">Enjoy your free time!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      {sorted.map(entry => (
        <div key={entry.id}
          className="flex gap-3 items-stretch"
        >
          {/* Time column */}
          <div className="flex flex-col items-end shrink-0 w-14 pt-1">
            <span className="text-xs text-base-content/60">{formatTime(entry.startTime)}</span>
            <div className="flex-1 w-px bg-base-300 my-1 mx-auto" />
            <span className="text-xs text-base-content/40">{formatTime(entry.endTime)}</span>
          </div>

          {/* Card */}
          <div
            className="flex-1 rounded-xl p-3 border"
            style={{
              backgroundColor: colorWithOpacity(entry.color || '#4ade80', 0.1),
              borderColor: colorWithOpacity(entry.color || '#4ade80', 0.3)
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-base-content">{entry.label}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.location && (
                    <span className="flex items-center gap-0.5 text-xs text-base-content/50">
                      <MapPin size={10} />{entry.location}
                    </span>
                  )}
                  {entry.professor && (
                    <span className="flex items-center gap-0.5 text-xs text-base-content/50">
                      <User size={10} />{entry.professor}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onEdit(entry)} className="btn btn-ghost btn-xs btn-circle hit-44"><Pencil size={12} /></button>
                <button onClick={() => deleteTimetableEntry(entry.id)} className="btn btn-ghost btn-xs btn-circle text-error hit-44"><Trash2 size={12} /></button>
              </div>
            </div>
            <span className="badge badge-xs badge-ghost mt-2">{entry.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
