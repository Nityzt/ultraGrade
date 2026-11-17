export const DEMO_PERSONA = {
  name: 'Maya',
  school: 'University of Toronto',
  semester: { id: 'demo-fall-2026', name: 'Fall 2026 · Ontario', startDate: '2026-09-08', endDate: '2026-12-18' },
  permitExpiryDate: '2027-03-31',
};

export const DEMO_COURSES = [
  {
    id: 'demo-csc309', semesterId: 'demo-fall-2026', code: 'CSC309', name: 'Programming on the Web',
    professor: 'Dr. Anika Patel', creditHours: 0.5, targetGrade: 85, color: '#65c7a5', outlineUploaded: true,
    categories: [
      { id: 'demo-csc309-labs', name: 'Labs', weight: 20, grades: [{ id: 'demo-grade-1', label: 'Lab 1', score: 92, maxScore: 100, weight: 1 }] },
      { id: 'demo-csc309-project', name: 'Project', weight: 35, grades: [] },
      { id: 'demo-csc309-final', name: 'Final exam', weight: 45, grades: [] },
    ]
  },
  {
    id: 'demo-eco101', semesterId: 'demo-fall-2026', code: 'ECO101', name: 'Principles of Microeconomics',
    professor: 'Prof. Daniel Wong', creditHours: 0.5, targetGrade: 80, color: '#8a9bf5', outlineUploaded: false,
    categories: [{ id: 'demo-eco101-midterm', name: 'Midterm', weight: 30, grades: [] }, { id: 'demo-eco101-final', name: 'Final exam', weight: 50, grades: [] }]
  },
  {
    id: 'demo-psy100', semesterId: 'demo-fall-2026', code: 'PSY100', name: 'Introduction to Psychology',
    professor: 'Dr. Olivia Chen', creditHours: 0.5, targetGrade: 82, color: '#f2b35e', outlineUploaded: false,
    categories: [{ id: 'demo-psy100-quiz', name: 'Quizzes', weight: 25, grades: [] }]
  }
];

export const DEMO_TASKS = [
  { id: 'demo-task-project', semesterId: 'demo-fall-2026', courseId: 'demo-csc309', title: 'Project proposal', type: 'assignment', dueDate: '2026-09-18', dueTime: '17:00', priority: 'high', completed: false, description: 'Submit a one-page project direction.' },
  { id: 'demo-task-econ', semesterId: 'demo-fall-2026', courseId: 'demo-eco101', title: 'Problem set 1', type: 'assignment', dueDate: '2026-09-22', dueTime: '23:59', priority: 'medium', completed: false },
  { id: 'demo-task-psych', semesterId: 'demo-fall-2026', courseId: 'demo-psy100', title: 'Research participation', type: 'task', dueDate: '2026-09-25', dueTime: '12:00', priority: 'low', completed: false },
];

export const DEMO_TIMETABLE = [
  { id: 'demo-class-web', semesterId: 'demo-fall-2026', courseId: 'demo-csc309', label: 'CSC309 lecture', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', location: 'BA 1170', professor: 'Dr. Anika Patel', color: '#65c7a5', type: 'lecture' },
  { id: 'demo-class-econ', semesterId: 'demo-fall-2026', courseId: 'demo-eco101', label: 'ECO101 lecture', dayOfWeek: 2, startTime: '13:00', endTime: '15:00', location: 'SS 2117', professor: 'Prof. Daniel Wong', color: '#8a9bf5', type: 'lecture' },
  { id: 'demo-class-psych', semesterId: 'demo-fall-2026', courseId: 'demo-psy100', label: 'PSY100 tutorial', dayOfWeek: 4, startTime: '11:00', endTime: '12:00', location: 'MP 102', professor: 'Dr. Olivia Chen', color: '#f2b35e', type: 'tutorial' },
];

export const DEMO_SETTINGS = {
  theme: 'ultragrade-classic', activeSemesterId: 'demo-fall-2026', gpaScale: 'standard-4.0', gradeDisplay: 'percentage', weekStartsOn: 1,
  studentType: 'international', school: DEMO_PERSONA.school, permitExpiryDate: DEMO_PERSONA.permitExpiryDate,
  studentName: DEMO_PERSONA.name, icsToken: 'demo-private-feed', calendarConnected: true, aiConsentVersion: 'demo-consent', aiConsentAt: '2026-07-20T09:00:00.000Z'
};

/** Fresh data for every demo session/reset. No browser persistence or account data is used. */
export function createDemoFixture() {
  return {
    courses: JSON.parse(JSON.stringify(DEMO_COURSES)),
    tasks: JSON.parse(JSON.stringify(DEMO_TASKS)),
    timetableEntries: JSON.parse(JSON.stringify(DEMO_TIMETABLE)),
    settings: JSON.parse(JSON.stringify(DEMO_SETTINGS)),
  };
}
