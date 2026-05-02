import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, ClipboardList, Globe, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 flex-1 transition-colors ${
          isActive ? 'text-primary' : 'text-base-content/50'
        }`
      }
    >
      <Icon size={20} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { settings } = useApp();
  const isInt = settings.studentType === 'international';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 flex items-center z-40 pb-safe no-print">
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
