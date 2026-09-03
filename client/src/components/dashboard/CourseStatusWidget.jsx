import { useApp } from '../../context/AppContext';
import { calcCourseGrade, calcWhatDoINeed, gradeHex, gradeGradient } from '../../utils/gradeCalculations';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

// Quiet "what do I need" hint under a course's progress bar — uses every
// still-ungraded category as the solve-for set (same default the WhatDoINeed
// modal starts with).
function whatDoINeedHint(course) {
  const categories = course.categories || [];
  if (categories.length === 0 || !course.targetGrade) return null;
  const { assessedWeight } = calcCourseGrade(course);
  if (assessedWeight >= 100) return null;
  const ungradedIds = categories.filter(c => !c.grades?.length).map(c => c.id);
  if (ungradedIds.length === 0) return null;
  const result = calcWhatDoINeed(course, course.targetGrade, ungradedIds);
  if (result.alreadySecured) return 'target secured ✓';
  if (result.impossible) return 'target out of reach';
  if (result.required != null) return `needs ${Math.round(result.required)}% avg on remaining`;
  return null;
}

export default function CourseStatusWidget() {
  const { activeCourses } = useApp();

  return (
    <div className="glass-card glass-hover h-full p-6 md:p-7 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-base-content/45">Course Mastery</h3>
        <Link to="/grades" className="text-[11px] text-primary hover:text-primary/70 font-medium">Manage →</Link>
      </div>

      {activeCourses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-base-content/40 text-sm py-8 gap-2">
          <BookOpen size={26} className="text-base-content/25" />
          No courses yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5">
          {activeCourses.map(course => {
            const { running, assessedWeight } = calcCourseGrade(course);
            const graded = running != null;
            const hex = graded ? gradeHex(running) : null;
            const hint = graded ? whatDoINeedHint(course) : null;
            return (
              <Link
                key={course.id}
                to="/grades"
                className="flex flex-col gap-2 group rounded-xl -m-1 p-1 transition-colors hover:bg-base-content/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    {/* course identity color lives here as a small dot, not on the bar */}
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-base-content truncate">{course.code}</div>
                      <div className="text-[11px] text-base-content/45 truncate">{course.name}</div>
                    </div>
                  </div>
                  <span className="font-display font-bold text-lg tabular shrink-0" style={{ color: hex || undefined }}>
                    {graded ? `${Math.round(running)}%` : '—'}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-base-content/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${graded ? Math.min(running, 100) : 0}%`,
                      background: graded ? gradeGradient(running) : undefined,
                      boxShadow: graded ? `0 0 10px ${hex}66` : undefined
                    }}
                  />
                </div>
                <div className="text-[10px] text-base-content/35">
                  {graded ? `${assessedWeight}% of grade assessed` : 'Not graded yet'}
                </div>
                {hint && <div className="text-xs text-base-content/40">{hint}</div>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
