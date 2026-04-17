import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function AddCategoryModal({ isOpen, onClose, courseId, editingCategory }) {
  const { addCategory, updateCategory, courses } = useApp();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const course = courses.find(c => c.id === courseId);
  const usedWeight = (course?.categories || [])
    .filter(c => !editingCategory || c.id !== editingCategory.id)
    .reduce((s, c) => s + (c.weight || 0), 0);
  const remaining = 100 - usedWeight;

  useEffect(() => {
    reset(editingCategory ? { name: editingCategory.name, weight: editingCategory.weight, dropLowest: editingCategory.dropLowest } : { name: '', weight: Math.min(remaining, 30), dropLowest: false });
  }, [editingCategory, isOpen, reset, remaining]);

  const onSubmit = (data) => {
    const payload = { ...data, weight: Number(data.weight) };
    if (editingCategory) updateCategory(courseId, editingCategory.id, payload);
    else addCategory(courseId, payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? 'Edit Category' : 'Add Grade Category'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="alert alert-info py-2 text-sm">
          <span>Weight budget: <strong>{usedWeight}% used</strong> · <strong>{remaining}% remaining</strong></span>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Category Name</span></label>
          <input {...register('name', { required: 'Required' })}
            className="input input-bordered input-sm" placeholder="Assignments, Midterm, Final Exam..." />
          {errors.name && <span className="text-error text-xs">{errors.name.message}</span>}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Weight (%)</span>
            <span className="label-text-alt text-base-content/50">Max: {remaining}%</span>
          </label>
          <input
            {...register('weight', { required: true, min: 1, max: remaining + (editingCategory?.weight || 0), valueAsNumber: true })}
            type="number" className="input input-bordered input-sm" />
          {errors.weight && <span className="text-error text-xs">Weight must be between 1 and {remaining}%</span>}
        </div>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Drop lowest grade</span>
            <input {...register('dropLowest')} type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button type="submit" className="btn btn-primary flex-1">
            {editingCategory ? 'Save' : 'Add Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
