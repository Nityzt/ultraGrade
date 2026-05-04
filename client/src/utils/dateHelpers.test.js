import { describe, it, expect } from 'vitest'
import {
  addDays,
  daysBetween,
  getUrgency,
  urgencyLabel,
  formatTime,
  timeToMinutes,
  timeAgo,
  today,
  dayName,
  dayFullName,
} from './dateHelpers.js'

// ---------------------------------------------------------------------------
// addDays
// ---------------------------------------------------------------------------
describe('addDays', () => {
  it('returns the same date when days is 0', () => {
    expect(addDays('2025-06-15', 0)).toBe('2025-06-15')
  })

  it('adds positive days', () => {
    expect(addDays('2025-06-15', 5)).toBe('2025-06-20')
  })

  it('subtracts days for negative values', () => {
    expect(addDays('2025-06-15', -3)).toBe('2025-06-12')
  })

  it('handles month boundaries', () => {
    expect(addDays('2025-01-30', 3)).toBe('2025-02-02')
  })

  it('handles year boundaries', () => {
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01')
  })
})

// ---------------------------------------------------------------------------
// daysBetween
// ---------------------------------------------------------------------------
describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2025-06-15', '2025-06-15')).toBe(0)
  })

  it('returns positive number when B is after A', () => {
    expect(daysBetween('2025-06-15', '2025-06-20')).toBe(5)
  })

  it('returns negative number when B is before A', () => {
    expect(daysBetween('2025-06-20', '2025-06-15')).toBe(-5)
  })

  it('counts across month boundaries correctly', () => {
    expect(daysBetween('2025-01-29', '2025-02-02')).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// getUrgency — derive all dates from today() so tests are always current
// ---------------------------------------------------------------------------
describe('getUrgency', () => {
  it('returns "done" for completed tasks regardless of due date', () => {
    const task = { completed: true, dueDate: addDays(today(), -5) }
    expect(getUrgency(task)).toBe('done')
  })

  it('returns "overdue" when due date is in the past', () => {
    const task = { completed: false, dueDate: addDays(today(), -1) }
    expect(getUrgency(task)).toBe('overdue')
  })

  it('returns "today" when due date is today', () => {
    const task = { completed: false, dueDate: today() }
    expect(getUrgency(task)).toBe('today')
  })

  it('returns "critical" when due tomorrow (diff = 1)', () => {
    const task = { completed: false, dueDate: addDays(today(), 1) }
    expect(getUrgency(task)).toBe('critical')
  })

  it('returns "soon" when due within reminderDays', () => {
    const task = { completed: false, dueDate: addDays(today(), 2), reminderDays: 3 }
    expect(getUrgency(task)).toBe('soon')
  })

  it('defaults reminderDays to 3', () => {
    const task = { completed: false, dueDate: addDays(today(), 3) }
    expect(getUrgency(task)).toBe('soon')
  })

  it('returns "upcoming" when due between reminderDays and 7 days', () => {
    const task = { completed: false, dueDate: addDays(today(), 5), reminderDays: 3 }
    expect(getUrgency(task)).toBe('upcoming')
  })

  it('returns "later" when due more than 7 days away', () => {
    const task = { completed: false, dueDate: addDays(today(), 8) }
    expect(getUrgency(task)).toBe('later')
  })
})

// ---------------------------------------------------------------------------
// urgencyLabel
// ---------------------------------------------------------------------------
describe('urgencyLabel', () => {
  it('maps overdue → "Overdue"', () => {
    expect(urgencyLabel('overdue')).toBe('Overdue')
  })
  it('maps critical → "Tomorrow"', () => {
    expect(urgencyLabel('critical')).toBe('Tomorrow')
  })
  it('maps today → "Today"', () => {
    expect(urgencyLabel('today')).toBe('Today')
  })
  it('maps done → "Done"', () => {
    expect(urgencyLabel('done')).toBe('Done')
  })
  it('falls back to "Later" for unknown urgency', () => {
    expect(urgencyLabel('unknown')).toBe('Later')
  })
})

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('returns empty string for falsy input', () => {
    expect(formatTime('')).toBe('')
    expect(formatTime(null)).toBe('')
  })

  it('formats midnight correctly', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('formats noon correctly', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('formats afternoon times', () => {
    expect(formatTime('14:30')).toBe('2:30 PM')
  })

  it('formats morning times', () => {
    expect(formatTime('09:05')).toBe('9:05 AM')
  })

  it('formats 11:59 PM correctly', () => {
    expect(formatTime('23:59')).toBe('11:59 PM')
  })
})

// ---------------------------------------------------------------------------
// timeToMinutes
// ---------------------------------------------------------------------------
describe('timeToMinutes', () => {
  it('returns 0 for midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0)
  })

  it('returns 60 for 01:00', () => {
    expect(timeToMinutes('01:00')).toBe(60)
  })

  it('returns 90 for 01:30', () => {
    expect(timeToMinutes('01:30')).toBe(90)
  })

  it('returns 1439 for 23:59', () => {
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('returns 750 for 12:30', () => {
    expect(timeToMinutes('12:30')).toBe(750)
  })
})

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------
describe('timeAgo', () => {
  const msAgo = (ms) => new Date(Date.now() - ms).toISOString()

  it('returns "just now" for < 1 minute ago', () => {
    expect(timeAgo(msAgo(30_000))).toBe('just now')
  })

  it('returns minutes for < 1 hour ago', () => {
    expect(timeAgo(msAgo(5 * 60_000))).toBe('5m ago')
  })

  it('returns hours for < 24 hours ago', () => {
    expect(timeAgo(msAgo(3 * 60 * 60_000))).toBe('3h ago')
  })

  it('returns days for >= 24 hours ago', () => {
    expect(timeAgo(msAgo(2 * 24 * 60 * 60_000))).toBe('2d ago')
  })
})

// ---------------------------------------------------------------------------
// dayName / dayFullName
// ---------------------------------------------------------------------------
describe('dayName', () => {
  it('returns Sun for 0', () => expect(dayName(0)).toBe('Sun'))
  it('returns Sat for 6', () => expect(dayName(6)).toBe('Sat'))
  it('returns Wed for 3', () => expect(dayName(3)).toBe('Wed'))
})

describe('dayFullName', () => {
  it('returns Sunday for 0', () => expect(dayFullName(0)).toBe('Sunday'))
  it('returns Friday for 5', () => expect(dayFullName(5)).toBe('Friday'))
})
