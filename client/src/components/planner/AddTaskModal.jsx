import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { today } from '../../utils/dateHelpers.js';

export default function AddTaskModal({ isOpen, onClose, editingTask }) {
  const { addTask, updateTask, activeCourses } = useApp();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    reset(editingTask
      ? { ...editingTask }
      : { title: '', type: 'assignment', courseId: '', dueDate: today(), dueTime: '23:59', priority: 'medium', reminderDays: 3, description: '' }
    );
  }, [editingTask, isOpen, reset]);

  const onSubmit = (data) => {
    if (editingTask) updateTask(editingTask.id, data);
    else addTask(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTask ? 'Edit Task' : 'Add Task'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Title</span></label>
          <input {...register('title', { required: true })} className="input input-bordered input-sm" placeholder="Assignment 2 — UML Diagrams" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Type</span></label>
            <select {...register('type')} className="select select-bordered select-sm">
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Priority</span></label>
            <select {...register('priority')} className="select select-bordered select-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {activeCourses.length > 0 && (
          <div className="form-control">
            <label className="label"><span className="label-text">Course (optional)</span></label>
            <select {...register('courseId')} className="select select-bordered select-sm">
              <option value="">— No course —</option>
              {activeCourses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Due Date</span></label>
            <input {...register('dueDate', { required: true })} type="date" className="input input-bordered input-sm" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Due Time</span></label>
            <input {...register('dueTime')} type="time" className="input input-bordered input-sm" />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Remind me (days before)</span>
            <span className="label-text-alt">0 = no reminder</span>
          </label>
          <input {...register('reminderDays', { min: 0, max: 30, valueAsNumber: true })} type="number" className="input input-bordered input-sm" />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Notes (optional)</span></label>
          <textarea {...register('description')} className="textarea textarea-bordered textarea-sm resize-none" rows={2} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button type="submit" className="btn btn-primary flex-1">{editingTask ? 'Save' : 'Add Task'}</button>
        </div>
      </form>
    </Modal>
  );
}
