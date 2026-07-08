import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, ClipboardList, Globe, BookOpen, Settings, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useThemeTransition } from '../../hooks/useThemeTransition.js';
import { calcSemesterGPA } from '../../utils/gradeCalculations.js';
import UserMenu from './UserMenu.jsx';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-primary/12 text-primary border-l-2 border-primary pl-[10px] translate-x-0.5'
            : 'text-base-content/55 hover:bg-base-content/5 hover:text-base-content'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className="transition-transform duration-200 group-hover:scale-110" style={isActive ? { filter: 'drop-shadow(0 0 6px hsl(var(--p) / 0.5))' } : undefined} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Controlled semester selector.
 *
 * DaisyUI's focus-based dropdown can't close on a second click of its own
 * trigger (re-clicking just keeps focus). This is a plain controlled menu, so
 * it toggles on trigger click and closes on selection, outside-click, or Esc.
 */
function SemesterSelector() {
  const { semesters, activeSemester, setActiveSemester } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (semesters.length === 0) return null;

  return (
    <div className="mb-3 relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="pill pill-hover w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-medium text-base-content/70"
      >
        <span className="truncate">{activeSemester?.name || 'Select Semester'}</span>
        <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 w-full glass-card rounded-2xl p-1.5 max-h-72 overflow-y-auto animate-fade-up"
          style={{ animationDuration: '0.18s' }}
        >
          {semesters.map(s => {
            const active = activeSemester?.id === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { setActiveSemester(s.id); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-left transition-colors ${
                    active ? 'bg-primary/12 text-primary font-medium' : 'text-base-content/70 hover:bg-base-content/5'
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  {active && <Check size={13} className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { settings, activeCourses } = useApp();
  const { meta, nextMeta, toggleProps } = useThemeTransition();
  const ThemeIcon = meta.Icon;

  const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
  const isInt = settings.studentType === 'international';

  return (
    <aside className="hidden md:flex flex-col w-64 h-full shrink-0 bg-base-200/70 backdrop-blur-xl border-r border-base-300/60 p-4 gap-1 overflow-y-auto no-print">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-6 mt-1">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-bloom">
          <GraduationCap size={19} className="text-primary-content" />
        </div>
        <div className="leading-tight">
          <span className="font-display font-bold text-xl tracking-tight block">
            <span className="text-primary">ultra</span>
            <span className="text-base-content">Grade</span>
          </span>
          <span className="text-[11px] text-base-content/40 tracking-wide">Academic Suite</span>
        </div>
      </div>

      {/* Semester selector */}
      <SemesterSelector />

      {/* GPA Badge */}
      {gpa !== null && (
        <div className="mx-1 mb-4 px-3.5 py-2.5 rounded-2xl bg-primary/8 border border-primary/20 flex items-center justify-between">
          <span className="text-xs text-base-content/50">Semester GPA</span>
          <span className="font-display font-bold text-primary text-base tabular glow-sage">{gpa.toFixed(2)}</span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/grades" icon={GraduationCap} label="Grades" />
        <NavItem to="/timetable" icon={Calendar} label="Timetable" />
        <NavItem to="/planner" icon={ClipboardList} label="Planner" />
        {isInt
          ? <NavItem to="/immigration" icon={Globe} label="Immigration" />
          : <NavItem to="/resources" icon={BookOpen} label="Student Resources" />
        }
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </nav>

      {/* Theme toggle + user */}
      <div className="mt-auto pt-3 border-t border-base-300/60 flex flex-col gap-1">
        <button
          {...toggleProps}
          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-2xl select-none text-left hover:bg-base-content/5 transition-colors group"
          aria-label={`Theme: ${meta.label}. Click to switch to ${nextMeta.label}`}
          title={`${meta.label} — click for ${nextMeta.label}`}
        >
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-base-content/70">{meta.label} theme</span>
            <span className="text-[10px] text-base-content/35">{meta.hint}</span>
          </span>
          <span className="w-7 h-7 rounded-full bg-primary/12 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-transform duration-300 group-hover:rotate-[18deg] group-active:scale-90">
            <ThemeIcon size={14} />
          </span>
        </button>
        <UserMenu />
      </div>
    </aside>
  );
}
