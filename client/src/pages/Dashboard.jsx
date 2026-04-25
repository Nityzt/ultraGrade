import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import QuickStatsRow from '../components/dashboard/QuickStatsRow';
import GPASummaryWidget from '../components/dashboard/GPASummaryWidget';
import UpcomingDeadlinesWidget from '../components/dashboard/UpcomingDeadlinesWidget';
import TodaysScheduleWidget from '../components/dashboard/TodaysScheduleWidget';
import CourseStatusWidget from '../components/dashboard/CourseStatusWidget';
import Modal from '../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { PlusCircle, GraduationCap, AlertCircle } from 'lucide-react';

function AddSemesterModal({ open, onClose }) {
  const { addSemester, setActiveSemester } = useApp();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', startDate: '', endDate: '' }
  });

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
            {...register('name', { required: 'Required' })}
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="mb-6 p-6 bg-primary/10 rounded-full">
        <GraduationCap size={64} className="text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Welcome to ultraGrade</h2>
      <p className="text-base-content/60 mb-6 max-w-sm">
        Get started by creating your first semester. You can then add courses, set your timetable, and track assignments.
      </p>
      <button onClick={onCreateSemester} className="btn btn-primary gap-2">
        <PlusCircle size={18} /> Create Your First Semester
      </button>
    </motion.div>
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
    <div className="p-4 md:p-6 space-y-4 max-w-5xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{greeting}{settings.studentName ? `, ${settings.studentName}` : ''}!</h1>
        {activeSemester && (
          <p className="text-base-content/60 text-sm">
            {activeSemester.name} · {today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        )}
      </motion.div>

      {/* Permit expiry warning */}
      {hasPermitExpiry && daysUntilExpiry !== null && daysUntilExpiry <= 60 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`alert ${daysUntilExpiry <= 14 ? 'alert-error' : 'alert-warning'} shadow-sm`}
        >
          <AlertCircle size={18} />
          <div>
            <div className="font-semibold">
              {daysUntilExpiry <= 0 ? 'Study permit has expired!' : `Study permit expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
            </div>
            <div className="text-sm opacity-80">
              {daysUntilExpiry <= 0
                ? 'Contact your international student office immediately.'
                : 'Contact your international student office to renew.'}
            </div>
          </div>
          <button onClick={() => navigate('/immigration')} className="btn btn-sm">Immigration Hub</button>
        </motion.div>
      )}

      {/* No active semester */}
      {!activeSemester && (
        <div className="alert alert-info shadow-sm">
          <AlertCircle size={18} />
          <span>No active semester selected. Pick one from the sidebar or create a new one.</span>
          <button onClick={() => setAddSemOpen(true)} className="btn btn-sm btn-info">Add Semester</button>
        </div>
      )}

      {/* Quick stats */}
      <QuickStatsRow />

      {/* Main widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1">
          <GPASummaryWidget />
        </div>
        <div className="xl:col-span-2">
          <UpcomingDeadlinesWidget />
        </div>
        <div className="xl:col-span-1">
          <TodaysScheduleWidget />
        </div>
        <div className="md:col-span-2 xl:col-span-2">
          <CourseStatusWidget />
        </div>
      </div>

      {/* Add semester button */}
      <div className="pt-2 flex justify-end">
        <button onClick={() => setAddSemOpen(true)} className="btn btn-ghost btn-sm gap-2">
          <PlusCircle size={14} /> New Semester
        </button>
      </div>

      <AddSemesterModal open={addSemOpen} onClose={() => setAddSemOpen(false)} />
    </div>
  );
}
