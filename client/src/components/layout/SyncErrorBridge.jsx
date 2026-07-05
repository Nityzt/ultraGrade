import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../ui/Toast.jsx';

/**
 * Bridges AppContext's background-sync state to the toast system so failures
 * and connectivity changes are actually announced (previously `syncError` was
 * captured but never surfaced). Renders nothing.
 */
export default function SyncErrorBridge() {
  const { syncError } = useApp();
  const toast = useToast();
  const last = useRef(null);

  useEffect(() => {
    if (syncError && syncError !== last.current) {
      last.current = syncError;
      toast.error(syncError);
    } else if (!syncError) {
      last.current = null;
    }
  }, [syncError, toast]);

  useEffect(() => {
    const onOffline = () =>
      toast.info('You’re offline — changes are saved locally and sync when you reconnect.', { duration: 6000 });
    const onOnline = () => toast.success('Back online — syncing your changes.');
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [toast]);

  return null;
}
