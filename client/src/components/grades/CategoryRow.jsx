import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import GradeEntryRow from './GradeEntryRow.jsx';
import AddGradeModal from './AddGradeModal.jsx';
import { calcCategoryGrade, gradeColorClass } from '../../utils/gradeCalculations.js';
import { useApp } from '../../context/AppContext.jsx';

function gradeBarColor(pct) {
  if (pct >= 80) return 'var(--grade-green, #4ade80)';
  if (pct >= 70) return 'var(--grade-blue, #60a5fa)';
  if (pct >= 60) return 'var(--grade-yellow, #fbbf24)';
  return 'var(--grade-red, #f87171)';
}

export default function CategoryRow({ category, courseId, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const { deleteGrade } = useApp();

  const earned = calcCategoryGrade(category);
  const colorClass = gradeColorClass(earned);

  return (
    <div className="border border-base-300 rounded-2xl overflow-hidden">
      {/* Category header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-base-300/20 cursor-pointer hover:bg-base-300/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded
            ? <ChevronDown size={13} className="text-base-content/40 shrink-0" />
            : <ChevronRight size={13} className="text-base-content/40 shrink-0" />
          }
          <span className="font-medium text-sm text-base-content truncate">{category.name}</span>
          <span className="badge badge-sm rounded-full bg-primary/10 text-primary border-0 text-[10px] font-semibold shrink-0">
            {category.weight}%
          </span>
          {category.dropLowest && (
            <span className="badge badge-xs rounded-full bg-base-300 text-base-content/50 border-0 shrink-0">
              ↓1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {earned !== null && (
            <span className={`font-mono text-sm font-semibold ${colorClass}`}>{earned.toFixed(1)}%</span>
          )}
          <button
            onClick={() => { setEditingGrade(null); setGradeModal(true); }}
            className="btn btn-ghost btn-xs gap-1 rounded-full"
          >
            <Plus size={11} /> Grade
          </button>
          <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle"><Pencil size={11} /></button>
          <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-error/50 hover:text-error"><Trash2 size={11} /></button>
        </div>
      </div>

      {/* Progress bar */}
      {earned !== null && (
        <div className="h-1 bg-base-300/50">
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(earned, 100)}%`, backgroundColor: gradeBarColor(earned) }}
          />
        </div>
      )}

      {/* Grade entries */}
      {expanded && (
        <div className="px-3 py-2 bg-base-300/10">
          {(category.grades || []).length === 0 ? (
            <p className="text-xs text-base-content/40 py-3 text-center">
              No grades yet — add your first above.
            </p>
          ) : (
            (category.grades || []).map(grade => (
              <GradeEntryRow
                key={grade.id}
                grade={grade}
                onEdit={() => { setEditingGrade(grade); setGradeModal(true); }}
                onDelete={() => deleteGrade(courseId, category.id, grade.id)}
              />
            ))
          )}
        </div>
      )}

      <AddGradeModal
        isOpen={gradeModal}
        onClose={() => { setGradeModal(false); setEditingGrade(null); }}
        courseId={courseId}
        categoryId={category.id}
        editingGrade={editingGrade}
      />
    </div>
  );
}
