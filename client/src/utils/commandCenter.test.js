import { describe, expect, it } from 'vitest';
import { getNextActions } from './commandCenter.js';

describe('command-center next actions', () => {
  const now = new Date('2026-09-15T12:00:00');
  const courses = [{ id: 'web', code: 'CSC309', outlineUploaded: false }, { id: 'econ', code: 'ECO101', outlineUploaded: true }];

  it('prioritizes unresolved permit, deadline, outline, and calendar actions', () => {
    const actions = getNextActions({
      now, courses,
      tasks: [
        { id: 'done', title: 'Completed task', dueDate: '2026-09-14', completed: true },
        { id: 'next', title: 'Project proposal', dueDate: '2026-09-18', courseId: 'web', completed: false },
      ],
      settings: { studentType: 'international', permitExpiryDate: '2027-03-31', calendarConnected: false },
    });
    expect(actions.map(action => action.key)).toEqual(['permit', 'deadline', 'outline', 'calendar']);
    expect(actions[1].detail).toContain('CSC309');
  });

  it('removes resolved setup actions and does not show permit guidance for domestic students', () => {
    const actions = getNextActions({
      now, courses: [{ id: 'web', code: 'CSC309', outlineUploaded: true }], tasks: [],
      settings: { studentType: 'domestic', calendarConnected: true },
    });
    expect(actions).toEqual([]);
  });
});
