import { dayFullName, formatTime } from '../../utils/dateHelpers.js';

export default function PrintView({ entries, semesterName }) {
  const days = [1, 2, 3, 4, 5];
  const byDay = {};
  for (const e of entries) {
    if (!byDay[e.dayOfWeek]) byDay[e.dayOfWeek] = [];
    byDay[e.dayOfWeek].push(e);
  }

  return (
    <div className="print-only p-8">
      <h1 className="text-2xl font-bold mb-1">Class Schedule</h1>
      {semesterName && <p className="text-gray-500 mb-6">{semesterName}</p>}
      {days.map(d => (
        byDay[d] && (
          <div key={d} className="mb-4">
            <h3 className="font-semibold text-lg border-b pb-1 mb-2">{dayFullName(d)}</h3>
            {[...byDay[d]].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(e => (
              <div key={e.id} className="flex gap-4 py-1 text-sm">
                <span className="w-32 text-gray-500">{formatTime(e.startTime)} – {formatTime(e.endTime)}</span>
                <span className="font-medium">{e.label}</span>
                {e.location && <span className="text-gray-500">{e.location}</span>}
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  );
}
