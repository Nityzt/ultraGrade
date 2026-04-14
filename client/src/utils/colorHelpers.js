// Color utilities for courses and grades

export const COURSE_COLORS = [
  '#818cf8', '#34d399', '#f472b6', '#fb923c', '#60a5fa',
  '#a78bfa', '#facc15', '#4ade80', '#f87171', '#38bdf8',
  '#c084fc', '#2dd4bf'
];

export function randomCourseColor() {
  return COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)];
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function colorWithOpacity(hex, opacity) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

export const TASK_TYPE_COLORS = {
  assignment: '#818cf8',
  exam: '#f87171',
  quiz: '#fbbf24',
  project: '#34d399',
  personal: '#94a3b8'
};

export const TASK_TYPE_BADGES = {
  assignment: 'badge-primary',
  exam: 'badge-error',
  quiz: 'badge-warning',
  project: 'badge-success',
  personal: 'badge-ghost'
};
