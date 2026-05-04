import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { hasLocalStorageData } from './migrationUtils.js'

// migrationUtils imports supabase — mock it so tests don't need a real connection
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('hasLocalStorageData', () => {
  it('returns false when localStorage is empty', () => {
    expect(hasLocalStorageData()).toBe(false)
  })

  it('returns false when semesters key is missing', () => {
    localStorage.setItem('ultragrade_courses', JSON.stringify([{ id: '1' }]))
    expect(hasLocalStorageData()).toBe(false)
  })

  it('returns false when semesters array is empty', () => {
    localStorage.setItem('ultragrade_semesters', JSON.stringify([]))
    expect(hasLocalStorageData()).toBe(false)
  })

  it('returns true when semesters exist and not yet migrated', () => {
    localStorage.setItem('ultragrade_semesters', JSON.stringify([{ id: 's1', name: 'Fall 2024' }]))
    expect(hasLocalStorageData()).toBe(true)
  })

  it('returns false when already migrated (flag = "1")', () => {
    localStorage.setItem('ultragrade_semesters', JSON.stringify([{ id: 's1', name: 'Fall 2024' }]))
    localStorage.setItem('ultragrade_migrated', '1')
    expect(hasLocalStorageData()).toBe(false)
  })

  it('returns true when migrated flag is present but not "1"', () => {
    localStorage.setItem('ultragrade_semesters', JSON.stringify([{ id: 's1' }]))
    localStorage.setItem('ultragrade_migrated', 'true') // not the exact string '1'
    expect(hasLocalStorageData()).toBe(true)
  })

  it('returns false when semesters JSON is malformed', () => {
    localStorage.setItem('ultragrade_semesters', 'not valid json {{{')
    expect(hasLocalStorageData()).toBe(false)
  })
})
