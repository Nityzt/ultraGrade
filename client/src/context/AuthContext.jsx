import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUpWithEmail = (email, password, meta) =>
    supabase.auth.signUp({ email, password, options: meta ? { data: meta } : undefined });

  // Guest mode — a real (anonymous) Supabase user, so all the normal Supabase
  // sync works and they can later upgrade to a full account. Requires
  // "Anonymous sign-ins" enabled in Supabase Auth.
  const signInAnonymously = () => supabase.auth.signInAnonymously();

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    // Clear the local app cache so the next account on this browser doesn't
    // briefly see the previous user's data (was the source of the phantom
    // "previous data found" banner and cross-account flashes). Auth keys
    // (sb-*) are managed by supabase and left untouched.
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ultragrade_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore storage errors */ }
    return result;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAnonymously, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
