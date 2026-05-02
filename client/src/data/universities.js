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

export function getRmpUrl(professorName, schoolName) {
  const uni = ONTARIO_UNIVERSITIES.find(u => u.name === schoolName);
  const encoded = encodeURIComponent(professorName);
  // if (uni?.rmpId) {
  //   return `https://www.ratemyprofessors.com/search/professors?q=${encoded}&sid=${uni.rmpId}`;
  // }
  return `https://www.ratemyprofessors.com/search/professors?q=${encoded}`;
}

export function getCourseRmpUrl(courseCode) {
  return `https://www.ratemyprofessors.com/search/professors?q=${encodeURIComponent(courseCode)}`;
}

export function getDefaultGpaScale(schoolName) {
  const uni = ONTARIO_UNIVERSITIES.find(u => u.name === schoolName);
  return uni?.defaultGpaScale || 'standard-4.0';
}
