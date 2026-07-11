import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { ONTARIO_UNIVERSITIES, getDefaultGpaScale } from '../data/universities';
import { GPA_SCALES } from '../data/gpaScales';
import { Palette, User, Globe, Book, Bell } from 'lucide-react';
import { useThemeTransition, THEMES, THEME_META } from '../hooks/useThemeTransition.js';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Header from '../components/layout/Header.jsx';
import CalendarSyncCard from '../components/settings/CalendarSyncCard';
import { supabase } from '../lib/supabase.js';
import { API_BASE_URL } from '../lib/apiBase.js';

const GPA_SCALE_OPTIONS = [
  { value: 'standard-4.0', label: 'Standard Ontario 4.0 (U of T, Waterloo, Western…)' },
  { value: 'york-4.0', label: 'York University New 4.0 (A = 3.90 at 85–89%)' },
  { value: 'york-9.0', label: 'York University Legacy 9.0' },
];

export default function Settings() {
  const { settings, updateSettings, updateSchool, setStudentType, semesters, deleteSemester, activeSemester } = useApp();
  const { user, signOut } = useAuth();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, watch, setValue, reset } = useForm({ defaultValues: settings });
  const { setTheme } = useThemeTransition();
  const watchedTheme = watch('theme');
  // Legacy 'ultragrade-dark' (removed) reads as Classic for the active highlight.
  const currentTheme = THEMES.includes(watchedTheme) ? watchedTheme : 'ultragrade-classic';

  // Apply instantly (with the circular reveal) AND keep the form field in sync so
  // a later Save doesn't revert it. setTheme persists via updateSettings itself.
  const pickTheme = (t, e) => { setValue('theme', t, { shouldDirty: true }); setTheme(t, e); };

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
      if (user) {
        // Delete every academic table explicitly, in dependency order, scoped by
        // user_id — robust regardless of FK cascade config. Sequential (not
        // Promise.all) so a child never races its parent's cascade.
        const tables = ['grades', 'categories', 'tasks', 'timetable_entries', 'study_hours', 'courses', 'semesters'];
        for (const table of tables) {
          const { error } = await supabase.from(table).delete().eq('user_id', user.id);
          if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
        }
        // Keep the user's identity (name / school / type / theme) — just detach
        // the now-deleted active semester so the app reloads clean.
        const { error: pErr } = await supabase
          .from('profiles')
          .update({ active_semester_id: null })
          .eq('id', user.id);
        if (pErr) throw new Error(pErr.message);
      }
      // Clear ONLY the app cache — never the supabase auth token (sb-*), or the
      // reload would sign the user out (that was the "doesn't work" bug).
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ultragrade_'))
        .forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    } catch (err) {
      setClearError(err.message || 'Something went wrong. Please try again.');
    }
  };

  const deleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      // Fresh token (context copy may be stale) for the JWT-gated endpoint.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Your session expired — please sign in again.');
      const res = await fetch(`${API_BASE_URL}/api/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Failed to delete account.');
      }
      // Account (and all data) gone — clear local cache and return to login.
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ultragrade_'))
        .forEach((k) => localStorage.removeItem(k));
      await signOut();
      window.location.assign('/login');
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <Header title="Settings" icon={Palette} />
      <div className="flex-1 flex flex-col p-4 md:p-6">
      {/* m-auto centers this block when it's shorter than the viewport, and collapses to top-aligned when content overflows — so leftover space is never dumped as a slab below the content */}
      <div className="m-auto w-full max-w-5xl space-y-4">

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Left column: Profile + School */}
          <div className="space-y-4 animate-fade-up">
            {/* Profile */}
            <div className="glass-card">
              <div className="card-body p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><User size={16} className="text-primary" /> Profile</h2>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Your Name</span></label>
                  <input {...register('studentName')} className="input input-bordered w-full" placeholder="e.g. Alex Kim" />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Student Type</span></label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" {...register('studentType')} value="international" className="radio radio-primary" />
                      <span className="text-sm">International</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" {...register('studentType')} value="domestic" className="radio radio-primary" />
                      <span className="text-sm">Domestic</span>
                    </label>
                  </div>
                </div>
                {watch('studentType') === 'international' && (
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text">Study Permit Expiry Date</span></label>
                    <input type="date" {...register('permitExpiryDate')} className="input input-bordered w-full" />
                    <label className="label py-1"><span className="label-text-alt text-base-content/50">Used for expiry reminders on the dashboard</span></label>
                  </div>
                )}
              </div>
            </div>

            {/* School */}
            <div className="glass-card">
              <div className="card-body p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><Globe size={16} className="text-primary" /> School</h2>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">University / College</span></label>
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
                  <label className="label py-1">
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
          </div>

          {/* Right column: Display + Danger Zone (balances height against the left column so the page fits without a blank gap) */}
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="glass-card">
              <div className="card-body p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><Palette size={16} className="text-primary" /> Display</h2>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Theme</span></label>
                  <input type="hidden" {...register('theme')} />
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map(t => {
                      const { label, hint, Icon } = THEME_META[t];
                      const active = currentTheme === t;
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={(e) => pickTheme(t, e)}
                          aria-pressed={active}
                          className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all ${
                            active
                              ? 'border-primary bg-primary/12 text-primary shadow-bloom'
                              : 'border-base-300 text-base-content/60 hover:border-base-content/25 hover:bg-base-content/5'
                          }`}
                        >
                          <Icon size={17} />
                          <span className="text-xs font-semibold">{label}</span>
                          <span className="text-[10px] text-base-content/40 text-center leading-tight">{hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Grade Display Format</span></label>
                  <select {...register('gradeDisplay')} className="select select-bordered w-full">
                    <option value="percentage">Percentage only (85%)</option>
                    <option value="letter">Letter grade only (A)</option>
                    <option value="both">Both (A · 85%)</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Week Starts On</span></label>
                  <select {...register('weekStartsOn', { valueAsNumber: true })} className="select select-bordered w-full">
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="glass-card !border-error/30">
              <div className="card-body p-4 space-y-3">
                <h2 className="font-semibold text-error">Danger Zone</h2>

                <div className="space-y-1.5">
                  <p className="text-sm text-base-content/60">Clear all academic data — removes every course, grade, timetable entry, task, and semester. Your account and profile stay. This cannot be undone.</p>
                  <button type="button" onClick={() => setClearConfirm(true)} className="btn btn-error btn-outline pressable w-fit">
                    Clear All Data
                  </button>
                  {clearError && (
                    <div className="alert alert-error text-sm rounded-2xl">
                      <span>{clearError}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-error/20 pt-3 space-y-1.5">
                  <p className="text-sm text-base-content/60">Delete your account permanently — removes your account and all associated data. This cannot be undone.</p>
                  <button type="button" onClick={() => { setDeleteError(null); setDeleteConfirm(true); }} className="btn btn-error pressable w-fit">
                    Delete Account
                  </button>
                  {deleteError && (
                    <div className="alert alert-error text-sm rounded-2xl">
                      <span>{deleteError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar sync uses its own context actions (not the form) — its
            buttons are type="button" so they never submit this form. */}
        <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
          <CalendarSyncCard />
        </div>

        {/* pr clears the Quick-add FAB (fixed bottom-right) when scrolled to the end */}
        <div className="flex justify-end pr-20 md:pr-44">
          <button type="submit" className="btn btn-primary pressable">Save Settings</button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={clearAllData}
        title="Clear All Data?"
        message="This will permanently delete all your semesters, courses, grades, timetable entries, and tasks. This action cannot be undone."
        danger={true}
        confirmLabel="Yes, Delete Everything"
      />

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={deleteAccount}
        title="Delete Account?"
        message="This permanently deletes your account and everything in it — courses, grades, tasks, timetable, and settings. You will be signed out and cannot undo this."
        danger={true}
        confirmLabel={deleting ? 'Deleting…' : 'Yes, Delete My Account'}
      />
      </div>
      </div>
    </div>
  );
}
