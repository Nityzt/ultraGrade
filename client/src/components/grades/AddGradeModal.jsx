import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { today } from '../../utils/dateHelpers.js';

export default function AddGradeModal({ isOpen, onClose, courseId, categoryId, editingGrade }) {
  const { addGrade, updateGrade } = useApp();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    reset(editingGrade
      ? { label: editingGrade.label, score: editingGrade.score, maxScore: editingGrade.maxScore, date: editingGrade.date, weight: editingGrade.weight || 1 }
      : { label: '', score: '', maxScore: 100, date: today(), weight: 1 }
    );
  }, [editingGrade, isOpen, reset]);

  const onSubmit = (data) => {
    const payload = { ...data, score: Number(data.score), maxScore: Number(data.maxScore), weight: Number(data.weight) || 1 };
    if (editingGrade) updateGrade(courseId, categoryId, editingGrade.id, payload);
    else addGrade(courseId, categoryId, payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingGrade ? 'Edit Grade' : 'Add Grade'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Label</span></label>
          <input {...register('label', { required: 'Required' })}
            className="input input-bordered input-sm" placeholder="Assignment 1, Midterm..." />
          {errors.label && <span className="text-error text-xs">{errors.label.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Score</span></label>
            <input {...register('score', { required: true, min: 0, valueAsNumber: true })}
              type="number" step="0.01" className="input input-bordered input-sm" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Out Of</span></label>
            <input {...register('maxScore', { required: true, min: 1, valueAsNumber: true })}
              type="number" step="0.01" className="input input-bordered input-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Date</span></label>
            <input {...register('date')} type="date" className="input input-bordered input-sm" />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Weight</span>
              <span className="label-text-alt text-base-content/40">within category</span>
            </label>
            <input {...register('weight', { min: 0.1, valueAsNumber: true })}
              type="number" step="0.01" className="input input-bordered input-sm" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button type="submit" className="btn btn-primary flex-1">
            {editingGrade ? 'Save' : 'Add Grade'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
