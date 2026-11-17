import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuickAdd } from './quickAddSchema.js';

test('accepts only known task IDs for edit actions', () => {
  const [item] = validateQuickAdd({ items: [{ action: 'complete_task', kind: 'task', taskId: 't1' }] }, [], ['t1']);
  assert.equal(item.action, 'complete_task');
  assert.throws(
    () => validateQuickAdd({ items: [{ action: 'complete_task', kind: 'task', taskId: 'fake' }] }, [], ['t1']),
    /detail|understand/
  );
});

test('requires a date when rescheduling', () => {
  assert.throws(
    () => validateQuickAdd({ items: [{ action: 'reschedule_task', kind: 'task', taskId: 't1' }] }, [], ['t1']),
    /detail|understand/
  );
});

test('keeps usable items and drops unusable ones in a multi-item payload', () => {
  const items = validateQuickAdd({
    items: [
      { kind: 'task', title: 'Lab report', dueDate: '2026-11-20' },
      { action: 'complete_task', kind: 'task', taskId: 'invented' },
      { kind: 'grade', score: 18, maxScore: 20, courseId: 'c1' }
    ]
  }, ['c1'], ['t1']);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Lab report');
  assert.equal(items[1].courseId, 'c1');
});
