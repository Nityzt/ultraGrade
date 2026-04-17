import { dayName } from '../../utils/dateHelpers.js';

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun

export default function DaySelector({ selectedDay, onChange }) {
  const today = new Date().getDay();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-4">
      {DAYS.map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`flex flex-col items-center px-3 py-2 rounded-xl shrink-0 transition-all ${
            selectedDay === d
              ? 'bg-primary text-primary-content'
              : today === d
              ? 'bg-primary/20 text-primary'
              : 'bg-base-200 text-base-content/60'
          }`}
        >
          <span className="text-xs font-medium">{dayName(d)}</span>
        </button>
      ))}
    </div>
  );
}
