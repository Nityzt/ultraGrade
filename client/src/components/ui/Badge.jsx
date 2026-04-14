import { getGradeInfo } from '../../data/gpaScales.js';
import { gradeColorClass } from '../../utils/gradeCalculations.js';
import { useApp } from '../../context/AppContext.jsx';

export function GradeBadge({ percentage }) {
  const { settings } = useApp();
  if (percentage === null || percentage === undefined) return <span className="badge badge-ghost">—</span>;
  const info = getGradeInfo(percentage, settings.gpaScale);
  const colorClass = gradeColorClass(percentage);
  return (
    <span className={`font-mono font-semibold text-sm ${colorClass}`}>
      {info.letter} · {percentage.toFixed(1)}%
    </span>
  );
}

export function GPABadge({ points, scaleKey }) {
  if (points === null || points === undefined) return null;
  const max = scaleKey === 'york-9.0' ? 9.0 : 4.0;
  const pct = (points / max) * 100;
  const colorClass = gradeColorClass(pct > 0 ? 80 * pct / 100 : 0);
  return (
    <span className={`font-mono text-sm font-medium ${colorClass}`}>
      {points.toFixed(2)} GPA
    </span>
  );
}
