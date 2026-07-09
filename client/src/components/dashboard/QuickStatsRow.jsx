import { useApp } from '../../context/AppContext';
import { today } from '../../utils/dateHelpers';
import { BookOpen, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';

export default function QuickStatsRow() {
  const { activeCourses, activeTasks, activeTimetable } = useApp();

  const todayDow = new Date().getDay();
  const classesToday = activeTimetable.filter(e => e.dayOfWeek === todayDow).length;
  const todayStr = today();
  const overdue = activeTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;
  const completed = activeTasks.filter(t => t.completed).length;
  const total = activeTasks.length;

  // Each tile navigates to the tab it summarises — a stat you can read is a
  // stat you expect to click.
  const stats = [
    { icon: BookOpen, label: 'Courses', value: activeCourses.length, to: '/grades', chip: 'bg-primary/12 text-primary', val: 'text-base-content' },
    { icon: Clock, label: 'Classes today', value: classesToday, to: '/timetable', chip: 'bg-info/12 text-info', val: 'text-base-content' },
    { icon: CheckSquare, label: 'Tasks done', value: `${completed}/${total}`, to: '/planner', chip: 'bg-success/12 text-success', val: 'text-base-content' },
    { icon: AlertTriangle, label: 'Overdue', value: overdue, to: '/planner', chip: overdue > 0 ? 'bg-error/12 text-error' : 'bg-base-content/8 text-base-content/40', val: overdue > 0 ? 'text-error' : 'text-base-content/50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map(({ icon: Icon, label, value, chip, val, to }) => (
        <Link
          key={label}
          to={to}
          className="glass-card glass-hover p-4 flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-[24px]"
        >
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${chip}`}>
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <div className={`text-2xl font-display font-bold tabular leading-none ${val}`}>
              {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
            </div>
            <div className="text-[11px] text-base-content/45 mt-1 truncate">{label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
