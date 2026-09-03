import { describe, it, expect } from 'vitest'
import { COURSE_COLORS, nextCourseColor } from './colorHelpers.js'

// ---------------------------------------------------------------------------
// nextCourseColor
// ---------------------------------------------------------------------------
describe('nextCourseColor', () => {
  it('returns the first palette color when there are no courses', () => {
    expect(nextCourseColor([])).toBe(COURSE_COLORS[0])
  })

  it('defaults to the first palette color when called with no argument', () => {
    expect(nextCourseColor()).toBe(COURSE_COLORS[0])
  })

  it('skips colors already used by existing courses', () => {
    const courses = [{ color: COURSE_COLORS[0] }, { color: COURSE_COLORS[1] }]
    expect(nextCourseColor(courses)).toBe(COURSE_COLORS[2])
  })

  it('picks an unused slot even when used colors are non-contiguous', () => {
    const courses = [{ color: COURSE_COLORS[0] }, { color: COURSE_COLORS[2] }]
    expect(nextCourseColor(courses)).toBe(COURSE_COLORS[1])
  })

  it('ignores colors outside the palette', () => {
    const courses = [{ color: '#123456' }]
    expect(nextCourseColor(courses)).toBe(COURSE_COLORS[0])
  })

  it('cycles by count when every palette color is used', () => {
    const all = COURSE_COLORS.map(color => ({ color }))
    // length % palette length === 0 → wraps back to the first color
    expect(nextCourseColor(all)).toBe(COURSE_COLORS[0])
  })

  it('continues the cycle as the course list grows past the palette', () => {
    const overfull = [...COURSE_COLORS.map(color => ({ color })), { color: COURSE_COLORS[0] }]
    expect(nextCourseColor(overfull)).toBe(COURSE_COLORS[1])
  })
})
