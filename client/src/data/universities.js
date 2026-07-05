// Ontario universities with Rate My Professors school IDs
export const ONTARIO_UNIVERSITIES = [
  { name: 'York University', rmpId: 1459, defaultGpaScale: 'york-4.0' },
  { name: 'University of Toronto', rmpId: 1484, defaultGpaScale: 'standard-4.0' },
  { name: 'University of Waterloo', rmpId: 1490, defaultGpaScale: 'standard-4.0' },
  { name: 'McMaster University', rmpId: 1453, defaultGpaScale: 'standard-4.0' },
  { name: 'Western University', rmpId: 1458, defaultGpaScale: 'standard-4.0' },
  { name: "Queen's University", rmpId: 1463, defaultGpaScale: 'standard-4.0' },
  { name: 'Toronto Metropolitan University', rmpId: 1461, defaultGpaScale: 'standard-4.0' },
  { name: 'Carleton University', rmpId: 1444, defaultGpaScale: 'standard-4.0' },
  { name: 'University of Ottawa', rmpId: 1460, defaultGpaScale: 'standard-4.0' },
  { name: 'Brock University', rmpId: 1443, defaultGpaScale: 'standard-4.0' },
  { name: 'University of Guelph', rmpId: 1449, defaultGpaScale: 'standard-4.0' },
  { name: 'Ontario Tech University', rmpId: 4430, defaultGpaScale: 'standard-4.0' },
  { name: 'Wilfrid Laurier University', rmpId: 1491, defaultGpaScale: 'standard-4.0' },
  { name: 'Lakehead University', rmpId: 1451, defaultGpaScale: 'standard-4.0' },
  { name: 'Trent University', rmpId: 1488, defaultGpaScale: 'standard-4.0' },
  { name: 'Other', rmpId: null, defaultGpaScale: 'standard-4.0' },
];

const RMP_BASE = 'https://www.ratemyprofessors.com/search/professors';

/**
 * Rate My Professors search URL for a professor.
 * When we know the school, we scope the search to that campus (RMP's
 * `/professors/{schoolId}?q=` form) so a common name resolves to the right
 * person instead of a national list of namesakes.
 */
export function getRmpUrl(professorName, schoolName) {
  const uni = ONTARIO_UNIVERSITIES.find(u => u.name === schoolName);
  const q = encodeURIComponent((professorName || '').trim());
  return uni?.rmpId ? `${RMP_BASE}/${uni.rmpId}?q=${q}` : `${RMP_BASE}?q=${q}`;
}

/** "Other professors" for a course — also scoped to the school when known. */
export function getCourseRmpUrl(courseCode, schoolName) {
  const uni = ONTARIO_UNIVERSITIES.find(u => u.name === schoolName);
  const q = encodeURIComponent((courseCode || '').trim());
  return uni?.rmpId ? `${RMP_BASE}/${uni.rmpId}?q=${q}` : `${RMP_BASE}?q=${q}`;
}

export function getDefaultGpaScale(schoolName) {
  const uni = ONTARIO_UNIVERSITIES.find(u => u.name === schoolName);
  return uni?.defaultGpaScale || 'standard-4.0';
}
