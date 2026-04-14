import { useMemo } from 'react';
import { calcCategoryGrade, calcCourseGrade, calcWhatDoINeed, gradeColorClass } from '../utils/gradeCalculations.js';
import { getGradeInfo } from '../data/gpaScales.js';
import { useApp } from '../context/AppContext.jsx';

export function useGradeCalc(course) {
  const { settings } = useApp();
  const scaleKey = settings.gpaScale || 'standard-4.0';

  return useMemo(() => {
    if (!course) return null;

    const { running, projected, assessedWeight } = calcCourseGrade(course);
    const displayGrade = course.finalGradeOverride ?? running;
    const gradeInfo = displayGrade !== null ? getGradeInfo(displayGrade, scaleKey) : null;

    const categoryGrades = {};
    for (const cat of course.categories || []) {
      categoryGrades[cat.id] = {
        earned: calcCategoryGrade(cat),
        weight: cat.weight,
        count: (cat.grades || []).length
      };
    }

    return {
      running,
      projected,
      assessedWeight,
      displayGrade,
      letterGrade: gradeInfo?.letter || '—',
      gpaPoints: gradeInfo?.points ?? null,
      colorClass: gradeColorClass(displayGrade),
      categoryGrades,
      whatDoINeed: (targetGrade, categoryIds) => calcWhatDoINeed(course, targetGrade, categoryIds)
    };
  }, [course, scaleKey]);
}
