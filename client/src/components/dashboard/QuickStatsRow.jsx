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
    { icon: BookOpen, label: 'Courses', value: activeCourses.length, color: 'text-primary' },
    { icon: Clock, label: 'Classes Today', value: classesToday, color: 'text-info' },
    { icon: CheckSquare, label: 'Tasks Done', value: `${completed}/${total}`, color: 'text-success' },
    { icon: AlertTriangle, label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-error' : 'text-base-content/40' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="card bg-base-200 shadow-sm">
          <div className="card-body p-4 flex-row items-center gap-3">
            <Icon size={20} className={color} />
            <div>
              <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
              <div className="text-xs text-base-content/60">{label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
