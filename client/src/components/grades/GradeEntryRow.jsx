import { Pencil, Trash2 } from 'lucide-react';
import { gradeColorClass } from '../../utils/gradeCalculations.js';
import { formatDate } from '../../utils/dateHelpers.js';

export default function GradeEntryRow({ grade, onEdit, onDelete }) {
  const pct = (grade.score / grade.maxScore) * 100;
  const colorClass = gradeColorClass(pct);

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-base-300/30 group transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm text-base-content/80 truncate">{grade.label || 'Unnamed'}</span>
        {grade.date && <span className="text-xs text-base-content/40">{formatDate(grade.date)}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-mono text-sm font-medium ${colorClass}`}>
          {grade.score}/{grade.maxScore} ({pct.toFixed(1)}%)
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle"><Pencil size={12} /></button>
          <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-error"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}
