import { describe, it, expect } from 'vitest'
import {
  calcCategoryGrade,
  calcCourseGrade,
  calcWhatDoINeed,
  calcSemesterGPA,
  gradeColorClass,
  gradeBgClass,
} from './gradeCalculations.js'

// ---------------------------------------------------------------------------
// calcCategoryGrade
// ---------------------------------------------------------------------------
describe('calcCategoryGrade', () => {
  it('returns null when no grades', () => {
    expect(calcCategoryGrade({ grades: [] })).toBeNull()
  })

  it('returns null when grades key is missing', () => {
    expect(calcCategoryGrade({})).toBeNull()
  })

  it('calculates percentage for a single grade', () => {
    const cat = { grades: [{ score: 80, maxScore: 100 }] }
    expect(calcCategoryGrade(cat)).toBe(80)
  })

  it('calculates weighted average across multiple grades', () => {
    const cat = {
      grades: [
        { score: 90, maxScore: 100, weight: 2 }, // 90% × 2
        { score: 60, maxScore: 100, weight: 1 }, // 60% × 1
      ],
    }
    // (90*2 + 60*1) / 3 = 240/3 = 80
    expect(calcCategoryGrade(cat)).toBeCloseTo(80)
  })

  it('uses weight 1 as default when weight not provided', () => {
    const cat = {
      grades: [
        { score: 70, maxScore: 100 },
        { score: 90, maxScore: 100 },
      ],
    }
    expect(calcCategoryGrade(cat)).toBeCloseTo(80)
  })

  it('drops the grade with the lowest percentage when dropLowest is true', () => {
    const cat = {
      dropLowest: true,
      grades: [
        { score: 90, maxScore: 100 }, // 90%
        { score: 40, maxScore: 100 }, // 40% ← lowest
        { score: 80, maxScore: 100 }, // 80%
      ],
    }
    // After dropping 40%: (90 + 80) / 2 = 85
    expect(calcCategoryGrade(cat)).toBeCloseTo(85)
  })

  it('drops by percentage not raw score when dropLowest is true', () => {
    const cat = {
      dropLowest: true,
      grades: [
        { score: 10, maxScore: 100 }, // 10% ← lowest pct
        { score: 9,  maxScore: 10  }, // 90%
      ],
    }
    // Drops the 10/100 grade; keeps 9/10 = 90%
    expect(calcCategoryGrade(cat)).toBeCloseTo(90)
  })

  it('does not drop when only one grade and dropLowest is true', () => {
    const cat = {
      dropLowest: true,
      grades: [{ score: 75, maxScore: 100 }],
    }
    expect(calcCategoryGrade(cat)).toBeCloseTo(75)
  })
})

// ---------------------------------------------------------------------------
// calcCourseGrade
// ---------------------------------------------------------------------------
describe('calcCourseGrade', () => {
  it('returns nulls when no categories', () => {
    expect(calcCourseGrade({ categories: [] })).toEqual({
      running: null,
      projected: null,
      assessedWeight: 0,
    })
  })

  it('returns nulls when categories key is missing', () => {
    expect(calcCourseGrade({})).toEqual({
      running: null,
      projected: null,
      assessedWeight: 0,
    })
  })

  it('calculates running grade from a single assessed category', () => {
    const course = {
      categories: [
        { weight: 50, grades: [{ score: 80, maxScore: 100 }] },
      ],
    }
    const { running, projected, assessedWeight } = calcCourseGrade(course)
    expect(running).toBeCloseTo(80)
    expect(projected).toBeCloseTo(40)   // 80% × 50/100 = 40
    expect(assessedWeight).toBe(50)
  })

  it('running is null when no categories have grades', () => {
    const course = {
      categories: [
        { weight: 50, grades: [] },
        { weight: 50, grades: [] },
      ],
    }
    const { running } = calcCourseGrade(course)
    expect(running).toBeNull()
  })

  it('running only counts assessed; projected assumes 0 for unassessed', () => {
    const course = {
      categories: [
        { weight: 50, grades: [{ score: 80, maxScore: 100 }] }, // assessed
        { weight: 50, grades: [] },                              // unassessed
      ],
    }
    const { running, projected } = calcCourseGrade(course)
    // running = 80 (only assessed category, weight 50, 80% → running = 80)
    expect(running).toBeCloseTo(80)
    // projected = 80*0.5 + 0*0.5 = 40
    expect(projected).toBeCloseTo(40)
  })

  it('running equals projected when all categories are assessed', () => {
    const course = {
      categories: [
        { weight: 60, grades: [{ score: 90, maxScore: 100 }] },
        { weight: 40, grades: [{ score: 70, maxScore: 100 }] },
      ],
    }
    const { running, projected } = calcCourseGrade(course)
    // projected = 90*0.6 + 70*0.4 = 54 + 28 = 82
    // running = (90*0.6 + 70*0.4) / 1.0 = 82
    expect(running).toBeCloseTo(82)
    expect(projected).toBeCloseTo(82)
  })
})

// ---------------------------------------------------------------------------
// calcWhatDoINeed
// ---------------------------------------------------------------------------
describe('calcWhatDoINeed', () => {
  it('returns impossible result when no target categories selected', () => {
    const course = { categories: [] }
    const result = calcWhatDoINeed(course, 80, [])
    expect(result.required).toBeNull()
    expect(result.possible).toBe(false)
  })

  it('calculates required grade for a target category', () => {
    // cat1 (weight 40) assessed at 90%; cat2 (weight 60) is the target
    const course = {
      categories: [
        { id: 'c1', weight: 40, grades: [{ score: 90, maxScore: 100 }] },
        { id: 'c2', weight: 60, grades: [] },
      ],
    }
    // lockedPoints = 90 * 40/100 = 36
    // required = (80 - 36) / (60/100) = 44 / 0.6 ≈ 73.33
    const { required, possible } = calcWhatDoINeed(course, 80, ['c2'])
    expect(required).toBeCloseTo(73.33, 1)
    expect(possible).toBe(true)
  })

  it('returns alreadySecured when locked points exceed target', () => {
    const course = {
      categories: [
        { id: 'c1', weight: 50, grades: [{ score: 95, maxScore: 100 }] },
        { id: 'c2', weight: 50, grades: [] },
      ],
    }
    // lockedPoints = 95 * 0.5 = 47.5; target = 40
    // required = (40 - 47.5) / 0.5 = negative → alreadySecured
    const { required, possible, alreadySecured } = calcWhatDoINeed(course, 40, ['c2'])
    expect(required).toBe(0)
    expect(possible).toBe(true)
    expect(alreadySecured).toBe(true)
  })

  it('returns impossible when needed grade exceeds 100', () => {
    const course = {
      categories: [
        { id: 'c1', weight: 70, grades: [{ score: 10, maxScore: 100 }] },
        { id: 'c2', weight: 30, grades: [] },
      ],
    }
    // lockedPoints = 10 * 0.7 = 7; target = 95
    // required = (95 - 7) / 0.3 ≈ 293 → impossible
    const { possible, impossible } = calcWhatDoINeed(course, 95, ['c2'])
    expect(possible).toBe(false)
    expect(impossible).toBe(true)
  })

  it('handles multiple target categories', () => {
    const course = {
      categories: [
        { id: 'c1', weight: 40, grades: [{ score: 80, maxScore: 100 }] },
        { id: 'c2', weight: 30, grades: [] },
        { id: 'c3', weight: 30, grades: [] },
      ],
    }
    // lockedPoints = 80 * 0.4 = 32; remainingWeight = 60
    // required = (75 - 32) / 0.6 ≈ 71.67
    const { required, possible } = calcWhatDoINeed(course, 75, ['c2', 'c3'])
    expect(required).toBeCloseTo(71.67, 1)
    expect(possible).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// calcSemesterGPA
// ---------------------------------------------------------------------------
describe('calcSemesterGPA', () => {
  it('returns null when no courses', () => {
    expect(calcSemesterGPA([])).toBeNull()
  })

  it('returns null when no courses have grades', () => {
    const courses = [
      { categories: [], finalGradeOverride: null },
    ]
    expect(calcSemesterGPA(courses)).toBeNull()
  })

  it('returns 4.0 for an 85% grade on standard-4.0 scale', () => {
    const courses = [
      {
        finalGradeOverride: null,
        creditHours: 3,
        categories: [{ weight: 100, grades: [{ score: 85, maxScore: 100 }] }],
      },
    ]
    expect(calcSemesterGPA(courses, 'standard-4.0')).toBeCloseTo(4.0)
  })

  it('returns 3.0 for a 73% grade on standard-4.0 scale', () => {
    const courses = [
      {
        finalGradeOverride: null,
        creditHours: 3,
        categories: [{ weight: 100, grades: [{ score: 73, maxScore: 100 }] }],
      },
    ]
    expect(calcSemesterGPA(courses, 'standard-4.0')).toBeCloseTo(3.0)
  })

  it('returns 3.9 for an 85% grade on york-4.0 scale', () => {
    const courses = [
      {
        finalGradeOverride: null,
        creditHours: 3,
        categories: [{ weight: 100, grades: [{ score: 85, maxScore: 100 }] }],
      },
    ]
    expect(calcSemesterGPA(courses, 'york-4.0')).toBeCloseTo(3.9)
  })

  it('uses finalGradeOverride over running grade', () => {
    const courses = [
      {
        finalGradeOverride: 95, // A+ → 4.0
        creditHours: 3,
        categories: [{ weight: 100, grades: [{ score: 50, maxScore: 100 }] }], // would be 1.0 otherwise
      },
    ]
    expect(calcSemesterGPA(courses, 'standard-4.0')).toBeCloseTo(4.0)
  })

  it('weights GPA by credit hours', () => {
    const courses = [
      {
        finalGradeOverride: null,
        creditHours: 3,
        categories: [{ weight: 100, grades: [{ score: 90, maxScore: 100 }] }], // A+ → 4.0
      },
      {
        finalGradeOverride: null,
        creditHours: 3,
        categories: [{ weight: 100, grades: [{ score: 73, maxScore: 100 }] }], // B → 3.0
      },
    ]
    // (4.0*3 + 3.0*3) / 6 = 21/6 = 3.5
    expect(calcSemesterGPA(courses, 'standard-4.0')).toBeCloseTo(3.5)
  })

  it('defaults to 3 credit hours when creditHours is not set', () => {
    const courses = [
      {
        finalGradeOverride: null,
        categories: [{ weight: 100, grades: [{ score: 90, maxScore: 100 }] }],
      },
      {
        finalGradeOverride: null,
        categories: [{ weight: 100, grades: [{ score: 73, maxScore: 100 }] }],
      },
    ]
    expect(calcSemesterGPA(courses, 'standard-4.0')).toBeCloseTo(3.5)
  })
})

// ---------------------------------------------------------------------------
// gradeColorClass / gradeBgClass
// ---------------------------------------------------------------------------
describe('gradeColorClass', () => {
  it('returns opacity class for null', () => {
    expect(gradeColorClass(null)).toBe('text-base-content opacity-50')
  })
  it('returns success for >= 80', () => {
    expect(gradeColorClass(80)).toBe('text-success')
    expect(gradeColorClass(100)).toBe('text-success')
  })
  it('returns error for < 50', () => {
    expect(gradeColorClass(49)).toBe('text-error')
  })
})

describe('gradeBgClass', () => {
  it('returns empty string for null', () => {
    expect(gradeBgClass(null)).toBe('')
  })
  it('returns success bg for >= 80', () => {
    expect(gradeBgClass(85)).toBe('bg-success/10 border-success/30')
  })
})
