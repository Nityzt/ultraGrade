import { useState, useEffect, useRef } from 'react';

export function useLocalStorage(key, initialValue) {
  const hydratedKey = useRef(key);
  const skipWriteKey = useRef(null);
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    // A user-scoped key can change during sign-in/sign-out. Hydrate the new
    // namespace before writing, otherwise the previous account's state would
    // be copied into the new account's cache.
    try {
      const item = window.localStorage.getItem(key);
      setValue(item ? JSON.parse(item) : initialValue);
    } catch {
      setValue(initialValue);
    }
    hydratedKey.current = key;
    skipWriteKey.current = key;
    // The following persistence effect owns writes for this key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (hydratedKey.current !== key) return;
    if (skipWriteKey.current === key) {
      skipWriteKey.current = null;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('localStorage write error:', err);
    }
  }, [key, value]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key && e.newValue) {
        try { setValue(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [value, setValue];
}
