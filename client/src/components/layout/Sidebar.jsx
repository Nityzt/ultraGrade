import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, ClipboardList, Globe, ChevronDown, Check, MessageCircle, Link2, RotateCcw, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useThemeTransition } from '../../hooks/useThemeTransition.js';
import UserMenu from './UserMenu.jsx';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/demo'}
      className={({ isActive }) =>
        `group pressable flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-primary/12 text-primary'
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

export default function Sidebar({ demo = false }) {
  const { resetDemo } = useApp();
  const { meta, nextMeta, toggleProps } = useThemeTransition();
  const ThemeIcon = meta.Icon;


  if (demo) return <aside className="hidden md:flex flex-col w-60 h-full shrink-0 demo-rail p-3 gap-1 overflow-y-auto no-print">
    <div className="flex items-center gap-3 px-3 py-3 mb-5"><div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-primary-content"><GraduationCap size={18} /></div><div><span className="font-display font-bold tracking-tight text-lg block"><span className="text-primary">ultra</span>Grade</span><span className="semantic-label">Student life OS</span></div></div>
    <div className="mx-2 mb-4"><span className="status-pill status-pill-primary">Demo mode</span></div>
    <nav className="flex flex-col gap-1 flex-1">
      <NavItem to="/demo" icon={LayoutDashboard} label="Home" />
      <NavItem to="/demo/ask" icon={MessageCircle} label="Ask ultraGrade" />
      <NavItem to="/demo/life" icon={Globe} label="Life Hub" />
      <NavItem to="/demo/connections" icon={Link2} label="Connections" />
      <NavItem to="/demo/profile" icon={UserRound} label="Profile" />
    </nav>
    <div className="pt-3 border-t border-base-content/8"><p className="semantic-label px-3 mb-2">Academic details</p><NavItem to="/demo/grades" icon={GraduationCap} label="Grades" /><NavItem to="/demo/planner" icon={ClipboardList} label="Planner" /><NavItem to="/demo/timetable" icon={Calendar} label="Timetable" /><button type="button" onClick={resetDemo} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-base-content/55 hover:bg-base-content/5"><RotateCcw size={17} /> Reset demo</button></div>
  </aside>;

  return (
    <aside className="hidden md:flex flex-col w-60 h-full shrink-0 app-rail p-3 gap-1 overflow-y-auto no-print">
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 py-3 mb-4">
        <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center">
          <GraduationCap size={19} className="text-primary-content" />
        </div>
        <div className="leading-tight">
          <span className="font-display font-bold text-lg tracking-tight block">
            <span className="text-primary">ultra</span>
            <span className="text-base-content">Grade</span>
          </span>
          <span className="semantic-label">Student life OS</span>
        </div>
      </div>

      {/* Semester selector */}
      <SemesterSelector />

      {/* Command-center navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/" icon={LayoutDashboard} label="Home" />
        <NavItem to="/ask" icon={MessageCircle} label="Ask ultraGrade" />
        <NavItem to="/life" icon={Globe} label="Life Hub" />
        <NavItem to="/connections" icon={Link2} label="Connections" />
        <NavItem to="/profile" icon={UserRound} label="Profile" />
      </nav>

      <div className="pt-3 mt-2 border-t border-base-content/8">
        <p className="semantic-label px-3 mb-2">Academic details</p>
        <NavItem to="/grades" icon={GraduationCap} label="Grades" />
        <NavItem to="/planner" icon={ClipboardList} label="Planner" />
        <NavItem to="/timetable" icon={Calendar} label="Timetable" />
      </div>

      {/* Theme toggle + user */}
      <div className="mt-auto pt-3 border-t border-base-300/60 flex flex-col gap-1">
        <button
          {...toggleProps}
          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl select-none text-left hover:bg-base-content/5 transition-colors group"
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
