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
    { icon: BookOpen, label: 'Courses', value: activeCourses.length, iconBg: 'bg-primary/10', iconColor: 'text-primary', valueColor: 'text-primary' },
    { icon: Clock, label: 'Classes Today', value: classesToday, iconBg: 'bg-info/10', iconColor: 'text-info', valueColor: 'text-info' },
    { icon: CheckSquare, label: 'Tasks Done', value: `${completed}/${total}`, iconBg: 'bg-success/10', iconColor: 'text-success', valueColor: 'text-success' },
    { icon: AlertTriangle, label: 'Overdue', value: overdue, iconBg: overdue > 0 ? 'bg-error/10' : 'bg-base-300/30', iconColor: overdue > 0 ? 'text-error' : 'text-base-content/40', valueColor: overdue > 0 ? 'text-error' : 'text-base-content/40' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, iconBg, iconColor, valueColor }) => (
        <div
          key={label}
          className="card bg-base-200 shadow-sm hover:-translate-y-0.5 transition-transform duration-150 cursor-default"
        >
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <div className={`text-2xl font-bold font-mono ${valueColor}`}>{value}</div>
              <div className="text-xs text-base-content/50 leading-tight">{label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
