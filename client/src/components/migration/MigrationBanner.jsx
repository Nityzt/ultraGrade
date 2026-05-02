import { useState, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { hasLocalStorageData, migrateLocalStorageToSupabase } from '../../utils/migrationUtils.js';

export default function MigrationBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user) setShow(hasLocalStorageData());
  }, [user]);

  if (!show) return null;

  const handleImport = async () => {
    setStatus('loading');
    const { count: n, error } = await migrateLocalStorageToSupabase(user.id);
    if (error) {
      setStatus('error');
    } else {
      setCount(n);
      setStatus('success');
      setTimeout(() => setShow(false), 3000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('ultragrade_migrated', '1');
    setShow(false);
  };

  return (
    <div className="mx-4 mt-4 alert alert-info shadow-md py-3 flex items-start gap-3">
      {status === 'success' ? (
        <>
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm flex-1">
            Imported {count} records from your previous session — all your data is now synced to your account.
          </span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm flex-1">Import failed — your local data is still safe. Try again or dismiss.</span>
          <button onClick={handleDismiss} className="btn btn-ghost btn-xs">Dismiss</button>
        </>
      ) : (
        <>
          <Upload size={18} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm flex-1">
            Found existing data from a previous session. Import it to your account?
          </span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleImport}
              disabled={status === 'loading'}
              className="btn btn-sm btn-primary"
            >
              {status === 'loading' && <span className="loading loading-spinner loading-xs" />}
              Import
            </button>
            <button onClick={handleDismiss} className="btn btn-sm btn-ghost btn-circle">
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
