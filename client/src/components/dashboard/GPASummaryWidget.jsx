import { useApp } from '../../context/AppContext';
import { calcSemesterGPA, calcCourseGrade } from '../../utils/gradeCalculations';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

function standingLabel(pct) {
  if (pct >= 90) return 'Top standing';
  if (pct >= 80) return "Dean's list range";
  if (pct >= 70) return 'Good standing';
  if (pct >= 60) return 'Satisfactory';
  return 'Needs focus';
}

export default function GPASummaryWidget() {
  const { activeCourses, settings } = useApp();
  const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
  const hasGpa = gpa !== null && !isNaN(gpa);
  const maxGpa = settings.gpaScale === 'york-9.0' ? 9.0 : 4.0;
  const pct = hasGpa && maxGpa > 0 ? (gpa / maxGpa) * 100 : 0;

  // Real per-course grades stand in for the trend sparkline.
  const courseBars = activeCourses
    .map(c => ({ code: c.code, color: c.color, grade: calcCourseGrade(c).running }))
    .filter(c => c.grade != null)
    .slice(0, 9);

  return (
    <div className="glass-card glass-hover h-full p-6 md:p-7 flex flex-col relative overflow-hidden">
      {/* ambient sage bloom */}
      <div className="absolute -right-12 -top-14 w-52 h-52 rounded-full bg-primary/15 blur-[46px] pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between mb-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-base-content/45">
          Semester GPA
        </span>
        {hasGpa && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/12 border border-primary/20 text-primary text-[11px] font-semibold">
            <TrendingUp size={12} />
            {Math.round(pct)}%
          </span>
        )}
      </div>

      {activeCourses.length === 0 ? (
        <div className="relative z-10 flex-1 flex items-center justify-center text-base-content/40 text-sm py-8">
          Add a course to see your GPA
        </div>
      ) : (
        <div className="relative z-10 flex flex-col flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-display font-bold text-6xl md:text-7xl leading-none tabular ${hasGpa ? 'text-primary glow-sage' : 'text-base-content/20'}`}>
              {hasGpa ? gpa.toFixed(2) : '0.00'}
            </span>
            <span className="text-sm text-base-content/40 font-medium">/ {maxGpa.toFixed(1)}</span>
          </div>
          <p className="text-xs text-base-content/50 mt-2">
            {hasGpa ? standingLabel(pct) : 'No grades entered yet'}
            <span className="text-base-content/30"> · {activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''}</span>
          </p>

          {/* progress to target */}
          <div className="mt-5">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[11px] text-base-content/45">Progress to {maxGpa.toFixed(1)}</span>
              <span className="text-[11px] text-primary font-semibold tabular">{Math.round(pct)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-base-content/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(pct, 100)}%`, boxShadow: '0 0 12px hsl(var(--p) / 0.5)' }}
              />
            </div>
          </div>

          {/* per-course grade bars — the honest sparkline */}
          {courseBars.length > 0 && (
            <div className="mt-auto pt-6">
              <div className="flex items-end gap-1.5 h-14">
                {courseBars.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group" title={`${c.code}: ${c.grade.toFixed(1)}%`}>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(Math.min(c.grade, 100), 6)}%`,
                        backgroundColor: c.color,
                        opacity: 0.85
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-base-content/35">Course grades</span>
                <Link to="/grades" className="text-[11px] text-primary hover:text-primary/70 font-medium">View all →</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
