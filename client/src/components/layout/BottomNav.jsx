import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, ClipboardList, Globe, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors ${
          isActive ? 'text-primary' : 'text-base-content/40'
        }`
      }
    >
      {({ isActive }) => (
        <div className="flex flex-col items-center gap-0.5">
          <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/15' : ''}`}>
            <Icon size={19} />
          </div>
          <span className="text-[9px] font-semibold tracking-wide uppercase">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const { settings } = useApp();
  const isInt = settings.studentType === 'international';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 flex items-center z-40 pb-safe no-print px-2">
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
