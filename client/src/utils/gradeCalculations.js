import { getGradeInfo, GPA_SCALES } from '../data/gpaScales.js';

// Calculate grade for a single category
export function calcCategoryGrade(category) {
  const { grades = [], dropLowest = false } = category;
  if (grades.length === 0) return null;

  let workingGrades = [...grades];

  // Drop lowest by score percentage if enabled
  if (dropLowest && workingGrades.length > 1) {
    let lowestIdx = 0;
    let lowestPct = workingGrades[0].score / workingGrades[0].maxScore;
    for (let i = 1; i < workingGrades.length; i++) {
      const pct = workingGrades[i].score / workingGrades[i].maxScore;
      if (pct < lowestPct) { lowestPct = pct; lowestIdx = i; }
    }
    workingGrades = workingGrades.filter((_, i) => i !== lowestIdx);
  }

  // Weighted average within category (each grade has its own weight, default 1)
  const totalWeight = workingGrades.reduce((sum, g) => sum + (g.weight || 1), 0);
  const weightedSum = workingGrades.reduce((sum, g) => {
    const pct = (g.score / g.maxScore) * 100;
    return sum + pct * (g.weight || 1);
  }, 0);

  return totalWeight === 0 ? null : weightedSum / totalWeight;
}

// Calculate overall course grade
export function calcCourseGrade(course) {
  const { categories = [] } = course;
  if (categories.length === 0) return { running: null, projected: null, assessedWeight: 0 };

  let weightedRunning = 0;
  let assessedWeight = 0;
  let weightedProjected = 0;

  for (const cat of categories) {
    const catGrade = calcCategoryGrade(cat);
    if (catGrade !== null) {
      weightedRunning += catGrade * (cat.weight / 100);
      assessedWeight += cat.weight;
    }
    // For projected: assume 0 on unassessed
    weightedProjected += (catGrade ?? 0) * (cat.weight / 100);
  }

  const running = assessedWeight > 0 ? (weightedRunning / (assessedWeight / 100)) : null;
  const projected = weightedProjected; // worst case

  return { running, projected, assessedWeight };
}

// What grade is needed on remaining assessments
export function calcWhatDoINeed(course, targetGrade, targetCategoryIds) {
  const { categories = [] } = course;

  // Points already locked in from completed categories
  let lockedPoints = 0;
  let remainingWeight = 0;

  for (const cat of categories) {
    const catGrade = calcCategoryGrade(cat);
    if (targetCategoryIds.includes(cat.id)) {
      // This is a category we're solving for
      remainingWeight += cat.weight;
    } else if (catGrade !== null) {
      // Already has grades — locked in
      lockedPoints += catGrade * (cat.weight / 100);
    }
    // If catGrade is null and not in targetCategoryIds, assume 0 (already accounted for)
  }

  if (remainingWeight === 0) return { required: null, possible: false, message: 'No target categories selected' };

  const required = (targetGrade - lockedPoints) / (remainingWeight / 100);

  if (required <= 0) return { required: 0, possible: true, alreadySecured: true };
  if (required > 100) return { required, possible: false, impossible: true };
  return { required, possible: true };
}

// Calculate semester GPA
export function calcSemesterGPA(courses, scaleKey = 'standard-4.0') {
  const gradedCourses = courses.filter(c => {
    const { running } = calcCourseGrade(c);
    return running !== null || c.finalGradeOverride !== null;
  });

  if (gradedCourses.length === 0) return null;

  let totalPoints = 0;
  let totalCredits = 0;

  for (const course of gradedCourses) {
    const { running } = calcCourseGrade(course);
    const pct = course.finalGradeOverride ?? running;
    if (pct === null) continue;
    const gradeInfo = getGradeInfo(pct, scaleKey);
    totalPoints += gradeInfo.points * (course.creditHours || 3);
    totalCredits += course.creditHours || 3;
  }

  return totalCredits === 0 ? null : totalPoints / totalCredits;
}

// Get letter grade color class
export function gradeColorClass(percentage) {
  if (percentage === null || percentage === undefined) return 'text-base-content opacity-50';
  if (percentage >= 80) return 'text-success';
  if (percentage >= 70) return 'text-info';
  if (percentage >= 60) return 'text-warning';
  if (percentage >= 50) return 'text-orange-400';
  return 'text-error';
}

export function gradeBgClass(percentage) {
  if (percentage === null || percentage === undefined) return '';
  if (percentage >= 80) return 'bg-success/10 border-success/30';
  if (percentage >= 70) return 'bg-info/10 border-info/30';
  if (percentage >= 60) return 'bg-warning/10 border-warning/30';
  if (percentage >= 50) return 'bg-orange-400/10 border-orange-400/30';
  return 'bg-error/10 border-error/30';
}

/**
 * Grade-quality color as a raw hex — brand-consistent (green/lime high → ruby
 * low), used for progress fills, percentages and glows where a DaisyUI token
 * class won't do (inline styles). This keeps dashboard bars on the green brand
 * instead of the per-course identity color, which clashed.
 */
export function gradeHex(percentage) {
  if (percentage === null || percentage === undefined) return '#8a9391';
  if (percentage >= 80) return '#4ae176'; // spring green
  if (percentage >= 70) return '#7fb4d6'; // info blue
  if (percentage >= 60) return '#f7bb7e'; // amber
  if (percentage >= 50) return '#fb923c'; // orange
  return '#ffb4ab';                        // ruby
}

/**
 * Two-stop gradient for a progress bar — the "energy filling up" look. Top
 * grades earn the signature green→electric-lime sweep; lower bands get a subtler
 * two-tone of their quality color.
 */
export function gradeGradient(percentage) {
  if (percentage === null || percentage === undefined) return 'linear-gradient(90deg, #3a423f, #3a423f)';
  if (percentage >= 80) return 'linear-gradient(90deg, #22c55e, #c3f400)';
  if (percentage >= 70) return 'linear-gradient(90deg, #5a95c8, #7fb4d6)';
  if (percentage >= 60) return 'linear-gradient(90deg, #e0913f, #f7bb7e)';
  if (percentage >= 50) return 'linear-gradient(90deg, #e5731f, #fb923c)';
  return 'linear-gradient(90deg, #e08b84, #ffb4ab)';
}
