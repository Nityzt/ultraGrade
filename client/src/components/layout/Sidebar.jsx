import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, ClipboardList, Globe, BookOpen, Settings, ChevronDown, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { calcSemesterGPA } from '../../utils/gradeCalculations.js';
import UserMenu from './UserMenu.jsx';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
            : 'text-base-content/60 hover:bg-base-300/60 hover:text-base-content'
        }`
      }
    >
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { settings, semesters, activeSemester, activeCourses, setActiveSemester, updateSettings } = useApp();
  const navigate = useNavigate();

  const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
  const isInt = settings.studentType === 'international';
  const isDark = settings.theme === 'ultragrade-dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'ultragrade-light' : 'ultragrade-dark' });
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-base-200 border-r border-base-300 p-4 gap-1 no-print">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <GraduationCap size={17} className="text-base-100" />
        </div>
        <span className="font-bold text-xl tracking-tight">
          <span className="text-primary">ultra</span>
          <span className="text-base-content">Grade</span>
        </span>
      </div>

      {/* Semester selector */}
      {semesters.length > 0 && (
        <div className="mb-3">
          <div className="dropdown dropdown-bottom w-full">
            <label tabIndex={0} className="btn btn-sm btn-ghost w-full justify-between font-normal text-base-content/60 border border-base-300 rounded-2xl">
              <span className="truncate text-xs">{activeSemester?.name || 'Select Semester'}</span>
              <ChevronDown size={13} />
            </label>
            <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow-xl bg-base-200 rounded-2xl w-full border border-base-300 mt-1">
              {semesters.map(s => (
                <li key={s.id}>
                  <button
                    className={`rounded-xl text-sm ${activeSemester?.id === s.id ? 'bg-primary/15 text-primary font-medium' : ''}`}
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
        <div className="mx-1 mb-3 px-3 py-2 rounded-2xl bg-primary/8 border border-primary/20 flex items-center justify-between">
          <span className="text-xs text-base-content/50">Semester GPA</span>
          <span className="font-mono font-bold text-primary text-sm">{gpa.toFixed(2)}</span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 flex-1">
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
      <div className="mt-auto pt-3 border-t border-base-300 flex flex-col gap-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-base-content/40">{isDark ? 'Dark mode' : 'Light mode'}</span>
          <button onClick={toggleTheme} className="btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-primary">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <UserMenu />
      </div>
    </aside>
  );
}
