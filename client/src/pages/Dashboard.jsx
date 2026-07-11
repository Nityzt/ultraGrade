import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import QuickStatsRow from '../components/dashboard/QuickStatsRow';
import GPASummaryWidget from '../components/dashboard/GPASummaryWidget';
import UpcomingDeadlinesWidget from '../components/dashboard/UpcomingDeadlinesWidget';
import TodaysScheduleWidget from '../components/dashboard/TodaysScheduleWidget';
import CourseStatusWidget from '../components/dashboard/CourseStatusWidget';
import Modal from '../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { PlusCircle, GraduationCap, AlertCircle } from 'lucide-react';
import { inferSemesterDates } from '../utils/dateHelpers';

function AddSemesterModal({ open, onClose }) {
  const { addSemester, setActiveSemester } = useApp();
  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: { name: '', startDate: '', endDate: '' }
  });

  const nameReg = register('name', { required: 'Required' });
  // Smart-fill: "Fall 2025" → Sep 1–Dec 31, etc. Only when dates are still empty
  // so we never clobber a manual edit.
  const handleNameChange = (e) => {
    const inferred = inferSemesterDates(e.target.value);
    if (inferred && !getValues('startDate') && !getValues('endDate')) {
      setValue('startDate', inferred.startDate);
      setValue('endDate', inferred.endDate);
    }
  };

  const onSubmit = (data) => {
    const sem = addSemester(data);
    setActiveSemester(sem.id);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Create Semester" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Semester Name</span></label>
          <input
            {...nameReg}
            onChange={(e) => { nameReg.onChange(e); handleNameChange(e); }}
            className="input input-bordered w-full"
            placeholder="e.g. Fall 2025"
          />
          {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Start Date</span></label>
            <input type="date" {...register('startDate')} className="input input-bordered w-full" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">End Date</span></label>
            <input type="date" {...register('endDate')} className="input input-bordered w-full" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" className="btn btn-primary">Create Semester</button>
        </div>
      </form>
    </Modal>
  );
}

function EmptyDashboard({ onCreateSemester }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-up">
      <div className="mb-6 w-24 h-24 rounded-[28px] bg-primary/12 border border-primary/20 flex items-center justify-center shadow-bloom">
        <GraduationCap size={52} className="text-primary" />
      </div>
      <h2 className="text-2xl font-display font-bold mb-2">Welcome to ultraGrade</h2>
      <p className="text-base-content/55 mb-6 max-w-sm">
        Start by creating your first semester. Then add courses, build your timetable, and track every deadline.
      </p>
      <button onClick={onCreateSemester} className="btn btn-primary gap-2 rounded-full">
        <PlusCircle size={18} /> Create your first semester
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { semesters, activeSemester, settings } = useApp();
  const [addSemOpen, setAddSemOpen] = useState(false);
  const navigate = useNavigate();

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = settings.studentName || (settings.studentType === 'international' ? 'International Student' : 'Student');

  const hasPermitExpiry = settings.studentType === 'international' && settings.permitExpiryDate;
  const daysUntilExpiry = hasPermitExpiry
    ? Math.ceil((new Date(settings.permitExpiryDate) - today) / (1000 * 60 * 60 * 24))
    : null;

  if (semesters.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyDashboard onCreateSemester={() => setAddSemOpen(true)} />
        <AddSemesterModal open={addSemOpen} onClose={() => setAddSemOpen(false)} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-7 space-y-5">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-sm text-base-content/50 mb-1">
            {today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            {greeting}{settings.studentName ? `, ${settings.studentName}` : ''}<span className="text-primary">.</span>
          </h1>
        </div>
        {activeSemester && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-200/70 border border-base-300/60 backdrop-blur-sm self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-primary bloom-dot text-primary" />
            <span className="text-xs font-medium text-base-content/70">{activeSemester.name}</span>
          </div>
        )}
      </div>

      {/* Permit expiry warning — glass surface, no DaisyUI alert bar */}
      {hasPermitExpiry && daysUntilExpiry !== null && daysUntilExpiry <= 60 && (
        <div className={`glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-l-4 ${daysUntilExpiry <= 14 ? 'border-l-error' : 'border-l-warning'}`}>
          <span className={`shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center ${daysUntilExpiry <= 14 ? 'bg-error/12 text-error' : 'bg-warning/15 text-warning'}`}>
            <AlertCircle size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">
              {daysUntilExpiry <= 0 ? 'Study permit has expired!' : `Study permit expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
            </div>
            <div className="text-xs text-base-content/60 mt-0.5">
              {daysUntilExpiry <= 0
                ? 'Contact your international student office immediately.'
                : 'Contact your international student office to renew.'}
            </div>
          </div>
          <button onClick={() => navigate('/immigration')} className="btn btn-sm btn-ghost pressable shrink-0 self-start sm:self-auto">Immigration Hub</button>
        </div>
      )}

      {/* No active semester */}
      {!activeSemester && (
        <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-l-4 border-l-info">
          <span className="shrink-0 w-9 h-9 rounded-2xl bg-info/15 text-info flex items-center justify-center">
            <AlertCircle size={18} />
          </span>
          <span className="flex-1 text-sm text-base-content/80">No active semester selected. Pick one from the sidebar or create a new one.</span>
          <button onClick={() => setAddSemOpen(true)} className="btn btn-sm btn-primary pressable shrink-0 self-start sm:self-auto">Add Semester</button>
        </div>
      )}

      {/* Quick stats */}
      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <QuickStatsRow />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <GPASummaryWidget />
        </div>
        <div className="lg:col-span-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <TodaysScheduleWidget />
        </div>
        <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <UpcomingDeadlinesWidget />
        </div>
        <div className="lg:col-span-12 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <CourseStatusWidget />
        </div>
      </div>

      {/* Add semester button */}
      <div className="pt-1 flex justify-end">
        <button onClick={() => setAddSemOpen(true)} className="btn btn-ghost btn-sm gap-2 rounded-full">
          <PlusCircle size={14} /> New semester
        </button>
      </div>

      <AddSemesterModal open={addSemOpen} onClose={() => setAddSemOpen(false)} />
    </div>
  );
}
