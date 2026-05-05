import { useApp } from '../../context/AppContext';
import { calcCourseGrade, gradeColorClass } from '../../utils/gradeCalculations';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProgressRing from '../ui/ProgressRing';

export default function CourseStatusWidget() {
  const { activeCourses } = useApp();

  return (
    <div className="card bg-base-200 shadow-sm h-full">
      <div className="card-body p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <BookOpen size={16} className="text-primary" /> Course Status
          </h3>
          <Link to="/grades" className="text-xs text-primary hover:text-primary/70 font-medium">Manage →</Link>
        </div>
        {activeCourses.length === 0 ? (
          <div className="text-center py-6 text-base-content/40 text-sm">No courses added</div>
        ) : (
          <ul className="space-y-2">
            {activeCourses.map(course => {
              const { running, assessedWeight } = calcCourseGrade(course);
              const colorClass = gradeColorClass(running);
              return (
                <li key={course.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-base-300/30 transition-colors">
                  <ProgressRing
                    value={running || 0}
                    size={40}
                    strokeWidth={4}
                    color={course.color}
                  >
                    <span className="text-[9px] font-bold" style={{ color: course.color }}>
                      {running != null ? `${Math.round(running)}` : '—'}
                    </span>
                  </ProgressRing>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{course.code}</div>
                    <div className="text-xs text-base-content/50 truncate">{course.name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {running != null ? (
                      <span className={`text-sm font-bold font-mono ${colorClass}`}>{running.toFixed(1)}%</span>
                    ) : (
                      <span className="text-sm text-base-content/30">—</span>
                    )}
                    <div className="text-[10px] text-base-content/40">{assessedWeight}% done</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
