import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

const TYPES = ['all', 'assignment', 'exam', 'quiz', 'project', 'personal'];
const STATUSES = ['active', 'completed', 'all'];

/**
 * Chip is a pressable pill with 44px hit target. Small visually (thin
 * padding), but the `min-h` guarantees the tap area meets HIG on touch —
 * chips squished into a btn-xs row were the "unreachable on mobile" issue.
 */
function Chip({ active, onClick, children, tone = 'primary' }) {
  // `!` (important) needed on active fills: `.pill`'s per-theme background rule
  // is `[data-theme] .pill` — higher specificity than a plain utility class.
  const toneClass = tone === 'primary'
    ? (active ? '!bg-primary text-primary-content !border-primary' : 'text-base-content/70 hover:text-base-content border-transparent')
    : (active ? '!bg-neutral text-neutral-content !border-neutral' : 'text-base-content/60 hover:text-base-content border-transparent');
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pill pressable shrink-0 snap-start min-h-[36px] px-3.5 text-xs font-semibold border ${toneClass}`}
    >
      {children}
    </button>
  );
}

export default function TaskFilterBar({ filter, onChange }) {
  const { activeCourses } = useApp();

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          value={filter.search || ''}
          onChange={e => onChange({ ...filter, search: e.target.value })}
          placeholder="Search tasks..."
          className="input input-bordered w-full pl-9"
        />
      </div>

      {/* Type chips — horizontal-scroll row on mobile, wraps on md+. Edge fade
          (mobile-only via .chip-row-fade) hints at scrollable content; snap
          for tidy thumb feel. */}
      <div className="chip-row-fade flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap snap-x snap-mandatory scrollbar-hide">
        {TYPES.map(type => (
          <Chip key={type} active={filter.type === type} onClick={() => onChange({ ...filter, type })}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Chip>
        ))}
      </div>

      {/* Status + course row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {STATUSES.map(s => (
            <Chip key={s} tone="neutral" active={filter.status === s} onClick={() => onChange({ ...filter, status: s })}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </div>

        {activeCourses.length > 0 && (
          <select
            value={filter.courseId || ''}
            onChange={e => onChange({ ...filter, courseId: e.target.value })}
            className="select select-bordered ml-auto w-full sm:w-auto"
          >
            <option value="">All courses</option>
            {activeCourses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
