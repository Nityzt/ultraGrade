import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { ONTARIO_UNIVERSITIES, getDefaultGpaScale } from '../data/universities';
import { GPA_SCALES } from '../data/gpaScales';
import { Palette, User, Globe, Book, Moon, Sun, Bell } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { supabase } from '../lib/supabase.js';

const GPA_SCALE_OPTIONS = [
  { value: 'standard-4.0', label: 'Standard Ontario 4.0 (U of T, Waterloo, Western…)' },
  { value: 'york-4.0', label: 'York University New 4.0 (A = 3.90 at 85–89%)' },
  { value: 'york-9.0', label: 'York University Legacy 9.0' },
];

export default function Settings() {
  const { settings, updateSettings, updateSchool, setStudentType, semesters, deleteSemester, activeSemester } = useApp();
  const { user } = useAuth();
  const [clearConfirm, setClearConfirm] = useState(false);
  const { register, handleSubmit, watch, setValue, reset } = useForm({ defaultValues: settings });

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const selectedSchool = watch('school');

  const onSubmit = (data) => {
    updateSettings(data);
    if (data.school !== settings.school) {
      updateSchool(data.school);
    }
  };

  const handleSchoolChange = (school) => {
    setValue('school', school);
    const suggested = getDefaultGpaScale(school);
    setValue('gpaScale', suggested);
  };

  const [clearError, setClearError] = useState(null);

  const clearAllData = async () => {
    setClearError(null);
    try {
      localStorage.clear();
      if (user) {
        const results = await Promise.all([
          supabase.from('semesters').delete().eq('user_id', user.id),
          supabase.from('timetable_entries').delete().eq('user_id', user.id),
          supabase.from('tasks').delete().eq('user_id', user.id),
          supabase.from('study_hours').delete().eq('user_id', user.id),
          supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' }),
        ]);
        const failed = results.find(r => r.error);
        if (failed) throw new Error(failed.error.message || 'Failed to clear data from database.');
      }
      window.location.reload();
    } catch (err) {
      setClearError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><User size={16} className="text-primary" /> Profile</h2>
            <div className="form-control">
              <label className="label"><span className="label-text">Your Name</span></label>
              <input {...register('studentName')} className="input input-bordered w-full" placeholder="e.g. Alex Kim" />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Student Type</span></label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...register('studentType')} value="international" className="radio radio-primary radio-sm" />
                  <span className="text-sm">International</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...register('studentType')} value="domestic" className="radio radio-primary radio-sm" />
                  <span className="text-sm">Domestic</span>
                </label>
              </div>
            </div>
            {watch('studentType') === 'international' && (
              <div className="form-control">
                <label className="label"><span className="label-text">Study Permit Expiry Date</span></label>
                <input type="date" {...register('permitExpiryDate')} className="input input-bordered w-full" />
                <label className="label"><span className="label-text-alt text-base-content/50">Used for expiry reminders on the dashboard</span></label>
              </div>
            )}
          </div>
        </div>

        {/* School */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Globe size={16} className="text-primary" /> School</h2>
            <div className="form-control">
              <label className="label"><span className="label-text">University / College</span></label>
              <select
                {...register('school')}
                onChange={e => handleSchoolChange(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select your school</option>
                {ONTARIO_UNIVERSITIES.map(u => (
                  <option key={u.name} value={u.name}>{u.name}</option>
                ))}
                <option value="Other">Other Ontario Institution</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">GPA Scale</span>
                <span className="label-text-alt text-base-content/50">Auto-selected based on school</span>
              </label>
              <select {...register('gpaScale')} className="select select-bordered w-full">
                {GPA_SCALE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Palette size={16} className="text-primary" /> Display</h2>
            <div className="form-control">
              <label className="label"><span className="label-text">Theme</span></label>
              <div className="flex gap-3">
                {['ultragrade-dark', 'ultragrade-light'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" {...register('theme')} value={t} className="radio radio-primary radio-sm" />
                    <span className="text-sm flex items-center gap-1">
                      {t === 'ultragrade-dark' ? <Moon size={14} /> : <Sun size={14} />}
                      {t === 'ultragrade-dark' ? 'Dark' : 'Light'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Grade Display Format</span></label>
              <select {...register('gradeDisplay')} className="select select-bordered w-full">
                <option value="percentage">Percentage only (85%)</option>
                <option value="letter">Letter grade only (A)</option>
                <option value="both">Both (A · 85%)</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Week Starts On</span></label>
              <select {...register('weekStartsOn', { valueAsNumber: true })} className="select select-bordered w-full">
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="card bg-base-200 border border-error/30 shadow-sm">
        <div className="card-body p-4 space-y-3">
          <h2 className="font-semibold text-error">Danger Zone</h2>
          <p className="text-sm text-base-content/60">Clearing all data will remove every course, timetable entry, task, and semester. This cannot be undone.</p>
          <button onClick={() => setClearConfirm(true)} className="btn btn-error btn-outline btn-sm w-fit">
            Clear All Data
          </button>
        </div>
      </div>

      {clearError && (
        <div className="alert alert-error text-sm rounded-2xl">
          <span>{clearError}</span>
        </div>
      )}

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={clearAllData}
        title="Clear All Data?"
        message="This will permanently delete all your semesters, courses, grades, timetable entries, and tasks. This action cannot be undone."
        danger={true}
        confirmLabel="Yes, Delete Everything"
      />
    </div>
  );
}
