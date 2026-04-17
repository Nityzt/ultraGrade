import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus, ExternalLink, ChevronDown, ChevronUp, Target, Timer, FileText, Cpu } from 'lucide-react';
import ProgressRing from '../ui/ProgressRing.jsx';
import CategoryRow from './CategoryRow.jsx';
import AddCategoryModal from './AddCategoryModal.jsx';
import WhatDoINeed from './WhatDoINeed.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useGradeCalc } from '../../hooks/useGradeCalc.js';
import { useApp } from '../../context/AppContext.jsx';
import { getRmpUrl, getCourseRmpUrl } from '../../data/universities.js';
import { colorWithOpacity } from '../../utils/colorHelpers.js';
import StudyTimer from './StudyTimer.jsx';

export default function CourseCard({ course, onEdit }) {
  const { deleteCourse, settings, updateCourse } = useApp();
  const calc = useGradeCalc(course);
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [needModal, setNeedModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  const rmpProfUrl = getRmpUrl(course.professor, settings.school);
  const rmpCourseUrl = getCourseRmpUrl(course.code);

  const progressColor = calc?.displayGrade >= 80 ? '#34d399'
    : calc?.displayGrade >= 70 ? '#38bdf8'
    : calc?.displayGrade >= 60 ? '#fbbf24'
    : calc?.displayGrade !== null ? '#f87171' : 'var(--p)';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card bg-base-200 border border-base-300 overflow-hidden"
    >
      {/* Color accent bar */}
      <div className="h-1" style={{ backgroundColor: course.color }} />

      <div className="card-body p-4 gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ProgressRing
              percentage={calc?.displayGrade}
              size={56}
              strokeWidth={5}
              color={progressColor}
            >
              <span className="font-mono text-xs font-bold">
                {calc?.displayGrade !== null ? `${Math.round(calc.displayGrade)}` : '—'}
              </span>
            </ProgressRing>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base-content">{course.code}</span>
                {course.outlineUploaded && <span className="badge badge-success badge-xs">imported</span>}
              </div>
              <p className="text-sm text-base-content/60 truncate">{course.name}</p>
              {course.professor && (
                <div className="flex items-center gap-1 mt-0.5">
                  <a href={rmpProfUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    onClick={e => e.stopPropagation()}>
                    {course.professor} <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Grade badge */}
          <div className="text-right shrink-0">
            {calc?.displayGrade !== null && (
              <div>
                <span className={`font-mono font-bold text-lg ${calc.colorClass}`}>
                  {calc.letterGrade}
                </span>
                <p className="text-xs text-base-content/50 font-mono">{calc.gpaPoints?.toFixed(1)} pts</p>
              </div>
            )}
          </div>
        </div>

        {/* Running vs projected */}
        {calc?.running !== null && (
          <div className="flex gap-3 text-xs">
            <span className="text-base-content/50">
              Running: <span className={`font-mono font-medium ${calc.colorClass}`}>{calc.running.toFixed(1)}%</span>
              <span className="text-base-content/30 ml-1">({calc.assessedWeight}% assessed)</span>
            </span>
            {calc.projected !== calc.running && (
              <span className="text-base-content/40">
                Projected: <span className="font-mono">{calc.projected.toFixed(1)}%</span>
              </span>
            )}
          </div>
        )}

        {/* RMP course link */}
        {course.code && (
          <a href={rmpCourseUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-base-content/40 hover:text-primary flex items-center gap-1 w-fit">
            <ExternalLink size={10} /> View other professors on Rate My Professors
          </a>
        )}

        {/* Categories */}
        <div className="flex flex-col gap-2">
          {(course.categories || []).map(cat => (
            <CategoryRow
              key={cat.id}
              category={cat}
              courseId={course.id}
              onEdit={() => { setEditingCat(cat); setCatModal(true); }}
              onDelete={() => { /* handled in CategoryRow with confirm */ }}
            />
          ))}
        </div>

        {/* Notes area */}
        <div>
          <button onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-1.5 text-xs text-base-content/40 hover:text-base-content transition-colors">
            <FileText size={12} />
            <span>Notes</span>
            {course.notes && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            {notesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {notesOpen && (
            <textarea
              value={course.notes || ''}
              onChange={e => updateCourse(course.id, { notes: e.target.value })}
              placeholder="Office hours, tips, reminders..."
              className="textarea textarea-bordered textarea-sm w-full mt-2 text-xs resize-none"
              rows={3}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-base-300/50">
          <button onClick={() => setCatModal(true)} className="btn btn-xs btn-ghost gap-1">
            <Plus size={12} /> Category
          </button>
          <button onClick={() => setNeedModal(true)} className="btn btn-xs btn-ghost gap-1">
            <Target size={12} /> Need?
          </button>
          <button onClick={() => setTimerOpen(true)} className="btn btn-xs btn-ghost gap-1">
            <Timer size={12} /> Study
          </button>
          <div className="ml-auto flex gap-1">
            <button onClick={onEdit} className="btn btn-xs btn-ghost btn-circle"><Pencil size={12} /></button>
            <button onClick={() => setConfirmDelete(true)} className="btn btn-xs btn-ghost btn-circle text-error"><Trash2 size={12} /></button>
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
