import { useApp } from '../../context/AppContext';
import { calcSemesterGPA } from '../../utils/gradeCalculations';
import { GPABadge } from '../ui/Badge';
import { TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GPASummaryWidget() {
  const { activeCourses, settings } = useApp();
  const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
  const maxGpa = settings.gpaScale === 'york-9.0' ? 9.0 : 4.0;
  const pct = maxGpa > 0 ? (gpa / maxGpa) * 100 : 0;

  const colorClass = pct >= 80 ? 'text-success' : pct >= 70 ? 'text-info' : pct >= 60 ? 'text-warning' : 'text-error';

  return (
    <div className="card bg-base-200 shadow-sm h-full">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Award size={16} className="text-primary" /> Semester GPA
          </h3>
          <Link to="/grades" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {activeCourses.length === 0 ? (
          <div className="text-center py-4 text-base-content/50 text-sm">No courses yet</div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold font-mono ${colorClass}`}>
              {isNaN(gpa) ? '—' : gpa.toFixed(2)}
            </div>
            <div className="flex-1">
              <div className="text-xs text-base-content/60 mb-1">of {maxGpa.toFixed(1)}</div>
              <progress
                className={`progress w-full ${pct >= 80 ? 'progress-success' : pct >= 70 ? 'progress-info' : pct >= 60 ? 'progress-warning' : 'progress-error'}`}
                value={isNaN(pct) ? 0 : pct}
                max="100"
              />
              <div className="text-xs text-base-content/50 mt-1">{activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''} · {settings.gpaScale}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
