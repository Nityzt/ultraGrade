// GPA scale definitions for Ontario universities
// Source: Conversion-Scales-for-New-Grading-Schemes.pdf (York University) + standard Ontario 4.0

export const GPA_SCALES = {
  'standard-4.0': {
    name: 'Standard Ontario 4.0',
    description: 'Used by U of T, Waterloo, Western, Queens, McMaster, Carleton, Ottawa',
    grades: [
      { letter: 'A+', minPercent: 90, maxPercent: 100, points: 4.0 },
      { letter: 'A',  minPercent: 85, maxPercent: 89,  points: 4.0 },
      { letter: 'A-', minPercent: 80, maxPercent: 84,  points: 3.7 },
      { letter: 'B+', minPercent: 77, maxPercent: 79,  points: 3.3 },
      { letter: 'B',  minPercent: 73, maxPercent: 76,  points: 3.0 },
      { letter: 'B-', minPercent: 70, maxPercent: 72,  points: 2.7 },
      { letter: 'C+', minPercent: 67, maxPercent: 69,  points: 2.3 },
      { letter: 'C',  minPercent: 63, maxPercent: 66,  points: 2.0 },
      { letter: 'C-', minPercent: 60, maxPercent: 62,  points: 1.7 },
      { letter: 'D+', minPercent: 57, maxPercent: 59,  points: 1.3 },
      { letter: 'D',  minPercent: 53, maxPercent: 56,  points: 1.0 },
      { letter: 'D-', minPercent: 50, maxPercent: 52,  points: 0.7 },
      { letter: 'F',  minPercent: 0,  maxPercent: 49,  points: 0.0 },
    ]
  },
  'york-4.0': {
    name: 'York University 4.0',
    description: 'York University new 4.0 grading scheme (A = 3.90, not 4.00)',
    minCGPA: 2.0,
    minHonoursGPA: 4.0,
    grades: [
      { letter: 'A+', minPercent: 90, maxPercent: 100, points: 4.0,  description: 'Excellent' },
      { letter: 'A',  minPercent: 85, maxPercent: 89,  points: 3.9,  description: 'Excellent' },
      { letter: 'A-', minPercent: 80, maxPercent: 84,  points: 3.7,  description: '' },
      { letter: 'B+', minPercent: 77, maxPercent: 79,  points: 3.3,  description: 'Good' },
      { letter: 'B',  minPercent: 73, maxPercent: 76,  points: 3.0,  description: 'Good' },
      { letter: 'B-', minPercent: 70, maxPercent: 72,  points: 2.7,  description: '' },
      { letter: 'C+', minPercent: 67, maxPercent: 69,  points: 2.3,  description: '' },
      { letter: 'C',  minPercent: 63, maxPercent: 66,  points: 2.0,  description: '' },
      { letter: 'C-', minPercent: 60, maxPercent: 62,  points: 1.7,  description: '' },
      { letter: 'D+', minPercent: 57, maxPercent: 59,  points: 1.3,  description: '' },
      { letter: 'D',  minPercent: 53, maxPercent: 56,  points: 1.0,  description: '' },
      { letter: 'D-', minPercent: 50, maxPercent: 52,  points: 0.7,  description: '' },
      { letter: 'F',  minPercent: 0,  maxPercent: 49,  points: 0.0,  description: 'Failing' },
    ]
  },
  'york-9.0': {
    name: 'York University 9.0 (Legacy)',
    description: 'York University old 9-point grading scheme',
    minCGPA: 5.0,
    minHonoursGPA: null,
    grades: [
      { letter: 'A+', minPercent: 90, maxPercent: 100, points: 9.0, description: 'Exceptional' },
      { letter: 'A',  minPercent: 80, maxPercent: 89,  points: 8.0, description: 'Excellent' },
      { letter: 'B+', minPercent: 75, maxPercent: 79,  points: 7.0, description: 'Very Good' },
      { letter: 'B',  minPercent: 70, maxPercent: 74,  points: 6.0, description: 'Good' },
      { letter: 'C+', minPercent: 65, maxPercent: 69,  points: 5.0, description: 'Competent' },
      { letter: 'C',  minPercent: 60, maxPercent: 64,  points: 4.0, description: 'Fairly Competent' },
      { letter: 'D+', minPercent: 55, maxPercent: 59,  points: 3.0, description: 'Passing' },
      { letter: 'D',  minPercent: 50, maxPercent: 54,  points: 2.0, description: 'Marginally Passing' },
      { letter: 'E',  minPercent: 40, maxPercent: 49,  points: 1.0, description: 'Marginally Failing (non-credit)' },
      { letter: 'F',  minPercent: 0,  maxPercent: 39,  points: 0.0, description: 'Failing' },
    ]
  }
};

export function getGradeInfo(percentage, scaleKey = 'standard-4.0') {
  const scale = GPA_SCALES[scaleKey];
  if (!scale) return { letter: 'N/A', points: 0 };
  const pct = Math.floor(percentage);
  const grade = scale.grades.find(g => pct >= g.minPercent && pct <= g.maxPercent);
  return grade || { letter: 'F', points: 0 };
}

export function getScaleMaxPoints(scaleKey = 'standard-4.0') {
  const scale = GPA_SCALES[scaleKey];
  if (!scale) return 4.0;
  return Math.max(...scale.grades.map(g => g.points));
}
