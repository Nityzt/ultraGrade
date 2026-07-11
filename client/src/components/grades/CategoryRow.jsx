import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronRight, GripVertical, Plus, Pencil, Trash2 } from 'lucide-react';
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

/** Inline quick-add — type a score and press Enter. No modal for the common case. */
function QuickAddGrade({ courseId, categoryId, gradeCount }) {
  const { addGrade } = useApp();
  const [label, setLabel] = useState('');
  const [score, setScore] = useState('');
  const [max, setMax] = useState('100');
  const scoreRef = useRef(null);

  const submit = () => {
    const s = parseFloat(score);
    const m = parseFloat(max);
    if (isNaN(s) || isNaN(m) || m <= 0) { scoreRef.current?.focus(); return; }
    addGrade(courseId, categoryId, {
      label: label.trim() || `Grade ${gradeCount + 1}`,
      score: s,
      maxScore: m,
    });
    setLabel('');
    setScore('');
    setMax('100');
    scoreRef.current?.focus(); // stay put for rapid entry
  };

  const onKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };

  return (
    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-base-300/40">
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={`Grade ${gradeCount + 1}`}
        className="input input-xs input-bordered rounded-lg flex-1 min-w-0 text-xs"
        aria-label="Grade label"
      />
      <input
        ref={scoreRef}
        value={score}
        onChange={e => setScore(e.target.value)}
        onKeyDown={onKeyDown}
        type="number" step="0.01" placeholder="Score"
        className="input input-xs input-bordered rounded-lg w-16 text-xs font-mono"
        aria-label="Score"
      />
      <span className="text-base-content/40 text-xs">/</span>
      <input
        value={max}
        onChange={e => setMax(e.target.value)}
        onKeyDown={onKeyDown}
        type="number" step="0.01" placeholder="Max"
        className="input input-xs input-bordered rounded-lg w-16 text-xs font-mono"
        aria-label="Out of"
      />
      <button
        onClick={submit}
        className="btn btn-xs btn-primary btn-circle shrink-0"
        aria-label="Add grade"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export default function CategoryRow({ category, courseId, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const { deleteGrade } = useApp();
  const reduceMotion = useReducedMotion();

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: category.id, transition: reduceMotion ? null : undefined });

  const earned = calcCategoryGrade(category);
  const colorClass = gradeColorClass(earned);
  const grades = category.grades || [];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border border-base-300 rounded-2xl overflow-hidden ${isDragging ? 'relative z-10 opacity-60' : ''}`}
    >
      {/* Category header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-base-300/20 cursor-pointer hover:bg-base-300/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 -ml-1 p-0.5 rounded text-base-content/25 hover:text-base-content/60 cursor-grab active:cursor-grabbing touch-none"
            aria-label={`Reorder ${category.name || 'category'}`}
          >
            <GripVertical size={13} />
          </button>
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
            onClick={() => setExpanded(true)}
            className="btn btn-ghost btn-xs gap-1 rounded-full"
            title="Add a grade"
          >
            <Plus size={11} /> Grade
          </button>
          <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle hit-44"><Pencil size={11} /></button>
          <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-error/50 hover:text-error hit-44"><Trash2 size={11} /></button>
        </div>
      </div>

      {/* Progress bar */}
      {earned !== null && (
        <div className="h-1 bg-base-300/50">
          <div
            className="h-1 rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${Math.min(earned, 100)}%`, backgroundColor: gradeBarColor(earned) }}
          />
        </div>
      )}

      {/* Grade entries + inline quick-add */}
      {expanded && (
        <div className="px-3 py-2 bg-base-300/10">
          {grades.length === 0 ? (
            <p className="text-xs text-base-content/40 pt-2 text-center">
              No grades yet — add one below.
            </p>
          ) : (
            grades.map(grade => (
              <GradeEntryRow
                key={grade.id}
                grade={grade}
                onEdit={() => { setEditingGrade(grade); setGradeModal(true); }}
                onDelete={() => deleteGrade(courseId, category.id, grade.id)}
              />
            ))
          )}
          <QuickAddGrade courseId={courseId} categoryId={category.id} gradeCount={grades.length} />
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
