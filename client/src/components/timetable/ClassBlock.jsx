import { colorWithOpacity } from '../../utils/colorHelpers.js';
import { formatTime } from '../../utils/dateHelpers.js';

export default function ClassBlock({ entry, style, onClick }) {
  const bg = colorWithOpacity(entry.color || '#818cf8', 0.2);
  const border = entry.color || '#818cf8';

  return (
    <div
      className="absolute rounded-md px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden group"
      style={{ ...style, backgroundColor: bg, borderLeft: `3px solid ${border}` }}
      onClick={onClick}
    >
      <p className="text-xs font-semibold text-base-content truncate leading-tight">{entry.label}</p>
      <p className="text-[10px] text-base-content/60 truncate">{formatTime(entry.startTime)} – {formatTime(entry.endTime)}</p>
      {entry.location && <p className="text-[10px] text-base-content/40 truncate">{entry.location}</p>}

      {/* Tooltip on hover */}
      <div className="absolute z-50 hidden group-hover:block left-full ml-2 top-0 bg-base-300 border border-base-300 rounded-lg p-2 text-xs w-48 shadow-xl pointer-events-none">
        <p className="font-semibold">{entry.label}</p>
        <p className="text-base-content/60">{formatTime(entry.startTime)} – {formatTime(entry.endTime)}</p>
        {entry.location && <p>{entry.location}</p>}
        {entry.professor && <p className="text-base-content/60">{entry.professor}</p>}
        <span className="badge badge-xs badge-ghost mt-1">{entry.type}</span>
      </div>
    </div>
  );
}
