import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuickAdd } from './quickAddSchema.js';

test('accepts only known task IDs for edit actions', () => {
  const item = validateQuickAdd({ action: 'complete_task', kind: 'task', taskId: 't1' }, [], ['t1']);
  assert.equal(item.action, 'complete_task');
  assert.throws(() => validateQuickAdd({ action: 'complete_task', kind: 'task', taskId: 'fake' }, [], ['t1']), /detail|understand/);
});

test('requires a date when rescheduling', () => {
  assert.throws(() => validateQuickAdd({ action: 'reschedule_task', kind: 'task', taskId: 't1' }, [], ['t1']), /detail|understand/);
});
