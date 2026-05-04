import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('checking'); // 'checking' | 'ready' | 'expired'
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashType = hashParams.get('type');

    if (code) {
      // PKCE flow — exchange the one-time code for a recovery session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setMode(error ? 'expired' : 'ready');
        window.history.replaceState({}, '', '/reset-password');
      });
    } else if (hashType === 'recovery') {
      // Implicit flow — session already set from URL hash
      setMode('ready');
      window.history.replaceState({}, '', '/reset-password');
    } else {
      setMode('expired');
    }
  }, []);

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    setStatus(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus({ type: 'error', msg: error.message });
      setSubmitting(false);
      return;
    }
    // Sign out the temporary recovery session so user logs in fresh
    await supabase.auth.signOut();
    setStatus({ type: 'success', msg: 'Password updated! Redirecting to sign in…' });
    setTimeout(() => navigate('/login'), 1500);
    setSubmitting(false);
  };

  if (mode === 'checking') {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (mode === 'expired') {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-base-content/60 mb-4">This link has expired or is invalid.</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">Back to Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-base-content tracking-tight">ultraGrade</h1>
            <p className="text-sm text-base-content/50 mt-1">Set a new password</p>
          </div>
        </div>

        <div className="card bg-base-200 border border-base-300 shadow-xl">
          <div className="card-body gap-5">
            {status && (
              <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'} py-2.5 text-sm`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{status.msg}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div>
                <label className="input input-bordered flex items-center gap-2 text-sm">
                  <Lock size={14} className="text-base-content/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    className="grow"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-base-content/40 hover:text-base-content"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </label>
                {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting && <span className="loading loading-spinner loading-xs" />}
                Set New Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
