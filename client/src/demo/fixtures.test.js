import { describe, expect, it } from 'vitest';
import { createDemoFixture, DEMO_PERSONA } from './fixtures.js';

describe('seeded demo fixture', () => {
  it('creates isolated, resettable data with the international persona', () => {
    const first = createDemoFixture();
    const second = createDemoFixture();
    first.tasks[0].completed = true;
    first.settings.studentName = 'Changed';
    expect(second.tasks[0].completed).toBe(false);
    expect(second.settings.studentName).toBe(DEMO_PERSONA.name);
    expect(second.settings.calendarConnected).toBe(true);
    expect(second.settings.studentType).toBe('international');
  });
});
