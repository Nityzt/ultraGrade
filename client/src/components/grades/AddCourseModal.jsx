import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import ColorPicker from '../ui/ColorPicker.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { randomCourseColor } from '../../utils/colorHelpers.js';

export default function AddCourseModal({ isOpen, onClose, editingCourse, onImportOutline }) {
  const { addCourse, updateCourse } = useApp();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { code: '', name: '', professor: '', creditHours: 3, targetGrade: 70, color: randomCourseColor() }
  });

  const color = watch('color');

  useEffect(() => {
    if (editingCourse) {
      reset({ ...editingCourse });
    } else {
      reset({ code: '', name: '', professor: '', creditHours: 3, targetGrade: 70, color: randomCourseColor() });
    }
  }, [editingCourse, isOpen, reset]);

  const onSubmit = (data) => {
    if (editingCourse) {
      updateCourse(editingCourse.id, data);
    } else {
      addCourse({ ...data, creditHours: Number(data.creditHours), targetGrade: Number(data.targetGrade) });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCourse ? 'Edit Course' : 'Add Course'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {!editingCourse && (
          <button type="button" onClick={onImportOutline}
            className="btn btn-outline btn-sm gap-2 w-full">
            <Upload size={14} /> Import from Course Outline (PDF/Image)
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Course Code</span></label>
            <input {...register('code', { required: 'Required' })}
              className="input input-bordered input-sm" placeholder="EECS 3311" />
            {errors.code && <span className="text-error text-xs mt-1">{errors.code.message}</span>}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Credit Hours</span></label>
            <input {...register('creditHours', { required: true, min: 0.5, max: 12 })}
              type="number" step="0.5" className="input input-bordered input-sm" />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Course Name</span></label>
          <input {...register('name', { required: 'Required' })}
            className="input input-bordered input-sm" placeholder="Software Design" />
          {errors.name && <span className="text-error text-xs mt-1">{errors.name.message}</span>}
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Professor</span></label>
          <input {...register('professor')} className="input input-bordered input-sm" placeholder="Dr. Smith" />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Target Grade (%)</span></label>
          <input {...register('targetGrade', { min: 0, max: 100 })}
            type="number" className="input input-bordered input-sm" />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Course Colour</span></label>
          <ColorPicker value={color} onChange={(c) => setValue('color', c)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button type="submit" className="btn btn-primary flex-1">
            {editingCourse ? 'Save Changes' : 'Add Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
