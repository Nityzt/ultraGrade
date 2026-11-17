import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal.jsx';
import ColorPicker from '../ui/ColorPicker.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { randomCourseColor } from '../../utils/colorHelpers.js';
import { timeToMinutes } from '../../utils/dateHelpers.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_DURATION_MINS = 90;

function minutesToTime(mins) {
  const clamped = Math.min(mins, 23 * 60 + 59);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function AddClassModal({ isOpen, onClose, editingEntry, prefillDay, prefillTime }) {
  const { addTimetableEntry, updateTimetableEntry, activeCourses } = useApp();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const color = watch('color');
  // Once the user manually edits the end time, stop auto-following the start time.
  const [endTouched, setEndTouched] = useState(false);

  useEffect(() => {
    setEndTouched(false);
    if (editingEntry) {
      reset({ ...editingEntry });
    } else {
      reset({
        label: '', dayOfWeek: prefillDay ?? 1, startTime: prefillTime ?? '09:00',
        endTime: '10:30', location: '', professor: '', color: randomCourseColor(),
        type: 'lecture', courseId: ''
      });
    }
  }, [editingEntry, isOpen, prefillDay, prefillTime, reset]);

  // Follow the start time with a 90-minute default end time until the user
  // edits the end field themselves.
  const startTime = watch('startTime');
  useEffect(() => {
    if (editingEntry || endTouched || !startTime) return;
    setValue('endTime', minutesToTime(timeToMinutes(startTime) + DEFAULT_DURATION_MINS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, editingEntry, endTouched]);

  const onSubmit = (data) => {
    const payload = { ...data, dayOfWeek: Number(data.dayOfWeek) };
    if (editingEntry) updateTimetableEntry(editingEntry.id, payload);
    else addTimetableEntry(payload);
    onClose();
  };

  // Auto-fill from course if linked
  const courseId = watch('courseId');
  useEffect(() => {
    if (courseId) {
      const c = activeCourses.find(x => x.id === courseId);
      if (c) {
        setValue('label', `${c.code} Lecture`);
        setValue('color', c.color);
        setValue('professor', c.professor);
      }
    }
  }, [courseId, activeCourses, setValue]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingEntry ? 'Edit Class' : 'Add Class'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {activeCourses.length > 0 && (
          <div className="form-control">
            <label className="label"><span className="label-text">Link to Course (optional)</span></label>
            <select {...register('courseId')} className="select select-bordered select-sm">
              <option value="">— No course link —</option>
              {activeCourses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="form-control col-span-2">
            <label className="label"><span className="label-text">Label</span></label>
            <input {...register('label', { required: 'Required' })} className="input input-bordered input-sm" placeholder="EECS 3311 Lecture" />
            {errors.label && <span className="text-error text-xs mt-1">Enter a class label.</span>}
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Day</span></label>
            <select {...register('dayOfWeek', { valueAsNumber: true })} className="select select-bordered select-sm">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Type</span></label>
            <select {...register('type')} className="select select-bordered select-sm">
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
              <option value="tutorial">Tutorial</option>
              <option value="exam">Exam</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Start Time</span></label>
            <input {...register('startTime', { required: true })} type="time" className="input input-bordered input-sm" />
            {errors.startTime && <span className="text-error text-xs mt-1">Choose a start time.</span>}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">End Time</span></label>
            <input
              {...register('endTime', { required: true, onChange: () => setEndTouched(true) })}
              type="time" className="input input-bordered input-sm"
            />
            {errors.endTime && <span className="text-error text-xs mt-1">Choose an end time.</span>}
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Location</span></label>
          <input {...register('location')} className="input input-bordered input-sm" placeholder="LAS B, Online..." />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Professor</span></label>
          <input {...register('professor')} className="input input-bordered input-sm" />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Colour</span></label>
          <ColorPicker value={color} onChange={c => setValue('color', c)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button type="submit" className="btn btn-primary flex-1">{editingEntry ? 'Save' : 'Add Class'}</button>
        </div>
      </form>
    </Modal>
  );
}
