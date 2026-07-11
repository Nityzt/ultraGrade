import { motion } from 'framer-motion';
import { dayName } from '../../utils/dateHelpers.js';
import { SPRING } from '../../lib/motion.js';

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun

/**
 * DaySelector — mobile day-tabs. A shared layoutId slides a single "active"
 * pill between chips (interruptible spring). Chip hit target is ≥44px so it
 * works on the iOS touch minimum.
 */
export default function DaySelector({ selectedDay, onChange }) {
  const today = new Date().getDay();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-4 scrollbar-hide">
      {DAYS.map(d => {
        const active = selectedDay === d;
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            aria-pressed={active}
            className={`pressable relative flex flex-col items-center justify-center min-w-[52px] min-h-[44px] px-3 py-2 rounded-xl shrink-0 transition-colors ${
              active
                ? 'text-primary-content'
                : today === d
                ? 'bg-primary/20 text-primary'
                : 'bg-base-200 text-base-content/60'
            }`}
          >
            {active && (
              <motion.span
                layoutId="dayselector-active"
                transition={SPRING}
                className="absolute inset-0 rounded-xl bg-primary shadow-bloom -z-10"
              />
            )}
            <span className="text-xs font-medium relative z-10">{dayName(d)}</span>
          </button>
        );
      })}
    </div>
  );
}
