import { useApp } from '../../context/AppContext';
import { today } from '../../utils/dateHelpers';
import { BookOpen, CheckSquare, Clock, AlertTriangle } from 'lucide-react';

export default function QuickStatsRow() {
  const { activeCourses, activeTasks, activeTimetable } = useApp();

  const todayDow = new Date().getDay();
  const classesToday = activeTimetable.filter(e => e.dayOfWeek === todayDow).length;
  const todayStr = today();
  const overdue = activeTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;
  const completed = activeTasks.filter(t => t.completed).length;
  const total = activeTasks.length;

  const stats = [
    { icon: BookOpen, label: 'Courses', value: activeCourses.length, chip: 'bg-primary/12 text-primary', val: 'text-base-content' },
    { icon: Clock, label: 'Classes today', value: classesToday, chip: 'bg-info/12 text-info', val: 'text-base-content' },
    { icon: CheckSquare, label: 'Tasks done', value: `${completed}/${total}`, chip: 'bg-success/12 text-success', val: 'text-base-content' },
    { icon: AlertTriangle, label: 'Overdue', value: overdue, chip: overdue > 0 ? 'bg-error/12 text-error' : 'bg-base-content/8 text-base-content/40', val: overdue > 0 ? 'text-error' : 'text-base-content/50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map(({ icon: Icon, label, value, chip, val }) => (
        <div key={label} className="glass-card glass-hover p-4 flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${chip}`}>
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <div className={`text-2xl font-display font-bold tabular leading-none ${val}`}>{value}</div>
            <div className="text-[11px] text-base-content/45 mt-1 truncate">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
