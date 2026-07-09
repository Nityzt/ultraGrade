import { useMemo } from 'react';
import { calcCourseGrade, calcSemesterGPA, gradeColorClass } from '../../utils/gradeCalculations.js';
import { getGradeInfo, GPA_SCALES } from '../../data/gpaScales.js';
import { useApp } from '../../context/AppContext.jsx';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';

function SemesterBar({ semester, courses, scaleKey, maxGPA }) {
  const semCourses = courses.filter(c => c.semesterId === semester.id);
  const gpa = calcSemesterGPA(semCourses, scaleKey);
  if (gpa === null) return null;
  const pct = (gpa / maxGPA) * 100;
  const color = gpa >= maxGPA * 0.75 ? '#34d399' : gpa >= maxGPA * 0.55 ? '#38bdf8' : gpa >= maxGPA * 0.35 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-base-content/60 w-28 truncate">{semester.name}</span>
      <div className="flex-1 h-5 bg-base-300 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-sm font-semibold w-10 text-right">{gpa.toFixed(2)}</span>
    </div>
  );
}

export default function GPADisplay({ courses }) {
  const { settings, semesters, courses: allCourses } = useApp();
  const scaleKey = settings.gpaScale || 'standard-4.0';
  const scale = GPA_SCALES[scaleKey];
  const maxGPA = Math.max(...scale.grades.map(g => g.points));

  const gpa = calcSemesterGPA(courses, scaleKey);
  const letterGrade = gpa !== null ? getGradeInfo((gpa / maxGPA) * 100, scaleKey) : null;

  const semestersWithGrades = semesters.filter(s => {
    const sc = allCourses.filter(c => c.semesterId === s.id);
    return calcSemesterGPA(sc, scaleKey) !== null;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Big GPA display */}
      {gpa !== null ? (
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-base-content/50 mb-1">Semester GPA</p>
            <div className="font-mono font-bold text-5xl text-primary">
              <AnimatedNumber value={gpa} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
            </div>
          </div>
          <div className="mb-1">
            <span className="badge badge-lg">{scale.name}</span>
            {letterGrade && <p className="text-base-content/60 text-sm mt-1">{letterGrade.letter}</p>}
          </div>
        </div>
      ) : (
        <p className="text-base-content/50 text-sm">Add grades to see your GPA.</p>
      )}

      {/* Course breakdown */}
      <div className="overflow-x-auto">
        <table className="table table-sm w-full">
          <thead>
            <tr className="text-base-content/50">
              <th>Course</th>
              <th className="text-center">Credits</th>
              <th className="text-center">Grade</th>
              <th className="text-center">Letter</th>
              <th className="text-center">GPA Pts</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => {
              const { running } = calcCourseGrade(course);
              const pct = course.finalGradeOverride ?? running;
              const info = pct !== null ? getGradeInfo(pct, scaleKey) : null;
              return (
                <tr key={course.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />
                      <span className="font-medium">{course.code}</span>
                      <span className="text-base-content/50 text-xs hidden sm:inline">{course.name}</span>
                    </div>
                  </td>
                  <td className="text-center">{course.creditHours}</td>
                  <td className={`text-center font-mono ${gradeColorClass(pct)}`}>{pct !== null ? `${pct.toFixed(1)}%` : '—'}</td>
                  <td className="text-center">{info?.letter || '—'}</td>
                  <td className="text-center font-mono">{info?.points?.toFixed(1) || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Semester comparison chart — desktop only */}
      {semestersWithGrades.length >= 2 && (
        <div className="hidden md:block">
          <h4 className="text-sm font-medium text-base-content/70 mb-3">Semester GPA Comparison</h4>
          <div className="flex flex-col gap-2">
            {semestersWithGrades.map(s => (
              <SemesterBar key={s.id} semester={s} courses={allCourses} scaleKey={scaleKey} maxGPA={maxGPA} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
