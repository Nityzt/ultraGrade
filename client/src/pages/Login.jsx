import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.532 24.552c0-1.636-.132-3.2-.378-4.695H24.48v9.098h12.902c-.558 2.94-2.22 5.432-4.728 7.104v5.892h7.656c4.476-4.122 7.062-10.2 7.062-17.4z" fill="#4285F4"/>
      <path d="M24.48 48c6.48 0 11.916-2.148 15.888-5.832l-7.656-5.892c-2.148 1.44-4.896 2.292-8.232 2.292-6.312 0-11.664-4.266-13.578-9.996H3.006v6.084C6.96 42.936 15.144 48 24.48 48z" fill="#34A853"/>
      <path d="M10.902 28.572A14.46 14.46 0 0 1 10.05 24c0-1.584.27-3.12.852-4.572v-6.084H3.006A23.994 23.994 0 0 0 .48 24c0 3.876.924 7.548 2.526 10.656l7.896-6.084z" fill="#FBBC05"/>
      <path d="M24.48 9.432c3.564 0 6.756 1.224 9.27 3.636l6.948-6.948C36.396 2.148 30.96 0 24.48 0 15.144 0 6.96 5.064 3.006 13.344l7.896 6.084c1.914-5.73 7.266-9.996 13.578-9.996z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const handleGoogleSignIn = async () => {
    setStatus(null);
    const { error } = await signInWithGoogle();
    if (error) setStatus({ type: 'error', msg: error.message });
  };

  const onSubmit = async ({ email, password }) => {
    setSubmitting(true);
    setStatus(null);
    try {
      if (tab === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setStatus({ type: 'success', msg: 'Check your email for a password reset link.' });
        reset();
        return;
      }
      const fn = tab === 'signup' ? signUpWithEmail : signInWithEmail;
      const { error } = await fn(email, password);
      if (error) throw error;
      if (tab === 'signup') {
        setStatus({ type: 'success', msg: 'Account created — check your inbox (and spam folder) for a verification link before signing in.' });
        reset();
      } else {
        navigate('/');
      }
    } catch (err) {
      const raw = err.message || '';
      let msg = raw;
      if (raw === 'Invalid login credentials') {
        msg = 'Incorrect email or password.';
      } else if (raw.toLowerCase().includes('email not confirmed')) {
        msg = 'Email not confirmed — check your inbox (and spam folder) for the verification link.';
      } else if (raw.toLowerCase().includes('user already registered')) {
        msg = 'An account with this email already exists. Try signing in instead.';
      } else if (raw.toLowerCase().includes('rate limit')) {
        msg = 'Too many attempts — please wait a moment and try again.';
      }
      setStatus({ type: 'error', msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-base-content tracking-tight">ultraGrade</h1>
            <p className="text-sm text-base-content/50 mt-1">Your academic toolkit</p>
          </div>
        </div>

        <div className="card bg-base-200 border border-base-300 shadow-xl">
          <div className="card-body gap-5">
            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-300/50">
              <button
                className={`tab flex-1 text-xs font-medium ${tab === 'signin' ? 'tab-active' : ''}`}
                onClick={() => { setTab('signin'); setStatus(null); reset(); }}
              >
                Sign In
              </button>
              <button
                className={`tab flex-1 text-xs font-medium ${tab === 'signup' ? 'tab-active' : ''}`}
                onClick={() => { setTab('signup'); setStatus(null); reset(); }}
              >
                Sign Up
              </button>
            </div>

            {/* Status banner */}
            {status && (
              <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'} py-2.5 text-sm`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{status.msg}</span>
              </div>
            )}

            {/* Google OAuth */}
            <button onClick={handleGoogleSignIn} className="btn btn-outline w-full gap-2 font-medium">
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="divider text-xs text-base-content/40 my-0">or continue with email</div>

            {/* Email/password form */}
            {tab !== 'reset' ? (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
                <div>
                  <label className="input input-bordered flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-base-content/40" />
                    <input
                      type="email"
                      placeholder="Email address"
                      className="grow"
                      {...register('email', { required: 'Email is required' })}
                    />
                  </label>
                  {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="input input-bordered flex items-center gap-2 text-sm">
                    <Lock size={14} className="text-base-content/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      className="grow"
                      {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="text-base-content/40 hover:text-base-content">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </label>
                  {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
                </div>

                <button type="submit" className="btn btn-primary w-full mt-1" disabled={submitting}>
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  {tab === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                {tab === 'signin' && (
                  <button type="button" onClick={() => { setTab('reset'); setStatus(null); reset(); }} className="text-xs text-base-content/50 hover:text-base-content text-center mt-1">
                    Forgot password?
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
                <p className="text-sm text-base-content/60">Enter your email and we'll send a reset link.</p>
                <div>
                  <label className="input input-bordered flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-base-content/40" />
                    <input
                      type="email"
                      placeholder="Email address"
                      className="grow"
                      {...register('email', { required: 'Email is required' })}
                    />
                  </label>
                  {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  Send Reset Link
                </button>
                <button type="button" onClick={() => { setTab('signin'); setStatus(null); reset(); }} className="text-xs text-base-content/50 hover:text-base-content text-center">
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
