import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import GradeEntryRow from './GradeEntryRow.jsx';
import AddGradeModal from './AddGradeModal.jsx';
import { calcCategoryGrade, gradeColorClass } from '../../utils/gradeCalculations.js';
import { useApp } from '../../context/AppContext.jsx';

export default function CategoryRow({ category, courseId, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const { deleteGrade } = useApp();

  const earned = calcCategoryGrade(category);
  const colorClass = gradeColorClass(earned);

  return (
    <div className="border border-base-300 rounded-lg overflow-hidden">
      {/* Category header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-base-300/30 cursor-pointer hover:bg-base-300/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} className="text-base-content/50" /> : <ChevronRight size={14} className="text-base-content/50" />}
          <span className="font-medium text-sm text-base-content">{category.name}</span>
          <span className="badge badge-ghost badge-sm">{category.weight}%</span>
          {category.dropLowest && <span className="badge badge-outline badge-xs">drop lowest</span>}
        </div>
        <div className="flex items-center gap-2">
          {earned !== null && (
            <span className={`font-mono text-sm font-semibold ${colorClass}`}>{earned.toFixed(1)}%</span>
          )}
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setEditingGrade(null); setGradeModal(true); }} className="btn btn-ghost btn-xs gap-1">
              <Plus size={12} /> Grade
            </button>
            <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle"><Pencil size={12} /></button>
            <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-error"><Trash2 size={12} /></button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {earned !== null && (
        <div className="h-1 bg-base-300">
          <div
            className="h-1 transition-all duration-500"
            style={{ width: `${Math.min(earned, 100)}%`, backgroundColor: earned >= 80 ? '#34d399' : earned >= 70 ? '#38bdf8' : earned >= 60 ? '#fbbf24' : '#f87171' }}
          />
        </div>
      )}

      {/* Grade entries */}
      {expanded && (
        <div className="px-4 py-2">
          {(category.grades || []).length === 0 ? (
            <p className="text-xs text-base-content/40 py-2 text-center">No grades yet. Add your first grade above.</p>
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
