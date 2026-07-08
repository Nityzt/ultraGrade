import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Pencil, Trash2, Plus, ExternalLink, ChevronDown, ChevronUp, Target, Timer, FileText } from 'lucide-react';
import ProgressRing from '../ui/ProgressRing.jsx';
import CategoryRow from './CategoryRow.jsx';
import AddCategoryModal from './AddCategoryModal.jsx';
import WhatDoINeed from './WhatDoINeed.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useGradeCalc } from '../../hooks/useGradeCalc.js';
import { useApp } from '../../context/AppContext.jsx';
import { getRmpUrl, getCourseRmpUrl } from '../../data/universities.js';
import StudyTimer from './StudyTimer.jsx';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';

function gradeProgressColor(pct) {
  if (pct === null) return 'var(--p)';
  if (pct >= 80) return 'var(--grade-green, #4ade80)';
  if (pct >= 70) return 'var(--grade-blue, #60a5fa)';
  if (pct >= 60) return 'var(--grade-yellow, #fbbf24)';
  return 'var(--grade-red, #f87171)';
}

/** Inline category quick-add — name + weight, Enter to save. Modal stays for advanced options (drop-lowest). */
function QuickAddCategory({ courseId, onClose }) {
  const { addCategory } = useApp();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const nameRef = useRef(null);

  const submit = () => {
    const w = parseFloat(weight);
    if (!name.trim() || isNaN(w)) { nameRef.current?.focus(); return; }
    addCategory(courseId, { name: name.trim(), weight: w });
    setName('');
    setWeight('');
    nameRef.current?.focus();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="flex items-center gap-1.5 p-2 rounded-2xl border border-base-300 bg-base-300/20">
      <input
        ref={nameRef} autoFocus value={name}
        onChange={e => setName(e.target.value)} onKeyDown={onKeyDown}
        placeholder="Category (e.g. Assignments)"
        className="input input-xs input-bordered rounded-lg flex-1 min-w-0 text-xs"
        aria-label="Category name"
      />
      <input
        value={weight}
        onChange={e => setWeight(e.target.value)} onKeyDown={onKeyDown}
        type="number" step="0.01" placeholder="Weight"
        className="input input-xs input-bordered rounded-lg w-16 text-xs font-mono"
        aria-label="Weight percent"
      />
      <span className="text-base-content/40 text-xs">%</span>
      <button onClick={submit} className="btn btn-xs btn-primary btn-circle shrink-0" aria-label="Add category">
        <Plus size={13} />
      </button>
    </div>
  );
}

export default function CourseCard({ course, onEdit }) {
  const { deleteCourse, deleteCategory, updateCategory, settings, updateCourse } = useApp();
  const calc = useGradeCalc(course);
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [needModal, setNeedModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  const rmpProfUrl = getRmpUrl(course.professor, settings.school);
  const rmpCourseUrl = getCourseRmpUrl(course.code, settings.school);
  const progressColor = gradeProgressColor(calc?.displayGrade ?? null);

  // Render (and drag) in persisted position order — updateCategory merges
  // fields in place without reordering the array, so this is the source of
  // truth rather than trusting course.categories' raw array order.
  const sortedCategories = useMemo(
    () => [...(course.categories || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [course.categories]
  );

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCategoryDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sortedCategories.findIndex(c => c.id === active.id);
    const newIndex = sortedCategories.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    arrayMove(sortedCategories, oldIndex, newIndex).forEach((cat, i) => {
      if (cat.position !== i) updateCategory(course.id, cat.id, { position: i });
    });
  };

  return (
    <motion.div
      layout
      className="glass-card glass-hover overflow-hidden"
      style={{ borderLeftColor: course.color, borderLeftWidth: '3px' }}
    >
      <div className="card-body p-4 gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ProgressRing
              percentage={calc?.displayGrade}
              size={58}
              strokeWidth={5}
              color={progressColor}
            >
              <span className="font-mono text-xs font-bold">
                {calc?.displayGrade !== null ? `${Math.round(calc.displayGrade)}` : '—'}
              </span>
            </ProgressRing>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base-content">{course.code}</span>
                {course.outlineUploaded && (
                  <span className="badge badge-xs rounded-full px-2" style={{ backgroundColor: `${course.color}20`, color: course.color }}>
                    imported
                  </span>
                )}
              </div>
              <p className="text-sm text-base-content/60 truncate">{course.name}</p>
              {course.professor && (
                <a
                  href={rmpProfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-base-content/40 hover:text-primary flex items-center gap-0.5 mt-0.5 w-fit"
                  onClick={e => e.stopPropagation()}
                >
                  {course.professor} <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>

          {/* Letter grade pill */}
          {calc?.displayGrade !== null && (
            <div className="shrink-0 text-center">
              <span
                className="inline-block font-mono font-bold text-lg px-3 py-0.5 rounded-full"
                style={{ backgroundColor: `${progressColor}20`, color: progressColor }}
              >
                {calc.letterGrade}
              </span>
              <p className="text-[10px] text-base-content/40 font-mono mt-0.5">{calc.gpaPoints?.toFixed(1)} pts</p>
            </div>
          )}
        </div>

        {/* Running vs projected stats */}
        {calc?.running !== null && (
          <div className="flex gap-4 text-xs bg-base-300/30 rounded-xl px-3 py-2">
            <div>
              <span className="text-base-content/40 block leading-tight">Running</span>
              <span className={`font-mono font-semibold ${calc.colorClass}`}>
                <AnimatedNumber value={calc.running} format={{ maximumFractionDigits: 1 }} suffix="%" />
              </span>
              <span className="text-base-content/30 ml-1 text-[10px]">({calc.assessedWeight}% assessed)</span>
            </div>
            {calc.projected !== calc.running && (
              <div className="border-l border-base-300 pl-4">
                <span className="text-base-content/40 block leading-tight">Projected</span>
                <span className="font-mono text-base-content/60">{calc.projected.toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={sortedCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {sortedCategories.map(cat => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  courseId={course.id}
                  onEdit={() => { setEditingCat(cat); setCatModal(true); }}
                  onDelete={() => deleteCategory(course.id, cat.id)}
                />
              ))}
              {addingCat && (
                <QuickAddCategory courseId={course.id} onClose={() => setAddingCat(false)} />
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Notes area */}
        <div>
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-1.5 text-xs text-base-content/40 hover:text-base-content/70 transition-colors"
          >
            <FileText size={12} />
            <span>Notes</span>
            {course.notes && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            {notesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {notesOpen && (
            <textarea
              value={course.notes || ''}
              onChange={e => updateCourse(course.id, { notes: e.target.value })}
              placeholder="Office hours, tips, reminders..."
              className="textarea textarea-bordered textarea-sm w-full mt-2 text-xs resize-none rounded-xl"
              rows={3}
            />
          )}
        </div>

        {/* RMP course link */}
        {course.code && (
          <a
            href={rmpCourseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-base-content/30 hover:text-primary flex items-center gap-1 w-fit"
          >
            <ExternalLink size={9} /> Other professors on Rate My Professors
          </a>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-base-300/40">
          <button onClick={() => setAddingCat(a => !a)} className={`btn btn-xs btn-ghost gap-1 rounded-full ${addingCat ? 'text-primary' : ''}`}>
            <Plus size={11} /> Category
          </button>
          <button onClick={() => setNeedModal(true)} className="btn btn-xs btn-ghost gap-1 rounded-full">
            <Target size={11} /> Need?
          </button>
          <button onClick={() => setTimerOpen(true)} className="btn btn-xs btn-ghost gap-1 rounded-full">
            <Timer size={11} /> Study
          </button>
          <div className="ml-auto flex gap-1">
            <button onClick={onEdit} className="btn btn-xs btn-ghost btn-circle hover:bg-base-300" aria-label={`Edit ${course.code || 'course'}`}>
              <Pencil size={12} />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="btn btn-xs btn-ghost btn-circle text-error/60 hover:text-error" aria-label={`Delete ${course.code || 'course'}`}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <AddCategoryModal
        isOpen={catModal}
        onClose={() => { setCatModal(false); setEditingCat(null); }}
        courseId={course.id}
        editingCategory={editingCat}
      />
      <WhatDoINeed isOpen={needModal} onClose={() => setNeedModal(false)} course={course} />
      <StudyTimer isOpen={timerOpen} onClose={() => setTimerOpen(false)} courseId={course.id} courseName={course.code} />
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteCourse(course.id)}
        title="Delete Course?"
        message={`This will permanently delete "${course.code}" and all its grades.`}
      />
    </motion.div>
  );
}
