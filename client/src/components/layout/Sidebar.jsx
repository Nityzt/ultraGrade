import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, ClipboardList, Globe, BookOpen, Settings, ChevronDown, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
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

export default function Sidebar() {
  const { settings, semesters, activeSemester, activeCourses, setActiveSemester, updateSettings } = useApp();

  const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
  const isInt = settings.studentType === 'international';
  const isDark = settings.theme === 'ultragrade-dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'ultragrade-light' : 'ultragrade-dark' });
  };

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
      {semesters.length > 0 && (
        <div className="mb-3">
          <div className="dropdown dropdown-bottom w-full">
            <label tabIndex={0} className="btn btn-sm btn-ghost w-full justify-between font-normal text-base-content/60 border border-base-300 rounded-2xl hover:border-primary/40">
              <span className="truncate text-xs">{activeSemester?.name || 'Select Semester'}</span>
              <ChevronDown size={13} />
            </label>
            <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow-xl bg-base-200 rounded-2xl w-full border border-base-300 mt-1">
              {semesters.map(s => (
                <li key={s.id}>
                  <button
                    className={`rounded-xl text-sm ${activeSemester?.id === s.id ? 'bg-primary/12 text-primary font-medium' : ''}`}
                    onClick={() => setActiveSemester(s.id)}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-base-content/40">{isDark ? 'Dark mode' : 'Light mode'}</span>
          <button onClick={toggleTheme} className="btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-primary" aria-label="Toggle theme">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <UserMenu />
      </div>
    </aside>
  );
}
