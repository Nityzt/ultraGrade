import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, ClipboardList, Globe, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
          isActive ? 'text-primary' : 'text-base-content/45 hover:text-base-content/80'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute top-0 w-8 h-1 rounded-b-full bg-primary shadow-bloom" />
          )}
          <Icon
            size={21}
            className="mb-1 transition-transform duration-200 group-active:scale-90"
            style={isActive ? { filter: 'drop-shadow(0 0 6px hsl(var(--p) / 0.55))' } : undefined}
          />
          <span className="text-[9px] font-bold tracking-wide uppercase">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const { settings } = useApp();
  const isInt = settings.studentType === 'international';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch h-20 pb-safe px-2 no-print bg-base-200/85 backdrop-blur-2xl border-t border-base-content/8 rounded-t-[24px] shadow-[0_-8px_32px_rgba(0,0,0,0.28)]">
      <NavItem to="/" icon={LayoutDashboard} label="Home" />
      <NavItem to="/grades" icon={GraduationCap} label="Grades" />
      <NavItem to="/timetable" icon={Calendar} label="Schedule" />
      <NavItem to="/planner" icon={ClipboardList} label="Planner" />
      {isInt
        ? <NavItem to="/immigration" icon={Globe} label="Visa" />
        : <NavItem to="/resources" icon={BookOpen} label="Resources" />
      }
    </nav>
  );
}
