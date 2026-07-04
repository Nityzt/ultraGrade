import { useApp } from '../../context/AppContext';
import { calcSemesterGPA } from '../../utils/gradeCalculations';
import { Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GPASummaryWidget() {
  const { activeCourses, settings } = useApp();
  const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
  const hasGpa = gpa !== null && !isNaN(gpa);
  const maxGpa = settings.gpaScale === 'york-9.0' ? 9.0 : 4.0;
  const pct = hasGpa && maxGpa > 0 ? (gpa / maxGpa) * 100 : 0;

  const progressColor = pct >= 80 ? 'bg-success' : pct >= 70 ? 'bg-info' : pct >= 60 ? 'bg-warning' : 'bg-error';
  const textColor = pct >= 80 ? 'text-success' : pct >= 70 ? 'text-info' : pct >= 60 ? 'text-warning' : 'text-error';

  return (
    <div className="card bg-base-200 shadow-sm h-full">
      <div className="card-body p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Award size={16} className="text-primary" /> Semester GPA
          </h3>
          <Link to="/grades" className="text-xs text-primary hover:text-primary/70 font-medium">View all →</Link>
        </div>
        {activeCourses.length === 0 ? (
          <div className="text-center py-6 text-base-content/40 text-sm">No courses yet</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold font-mono ${textColor}`}>
                {hasGpa ? gpa.toFixed(2) : '—'}
              </span>
              <span className="text-sm text-base-content/40">/ {maxGpa.toFixed(1)}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-base-300/50 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${progressColor}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-base-content/40">
              {activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''} · {settings.gpaScale}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
