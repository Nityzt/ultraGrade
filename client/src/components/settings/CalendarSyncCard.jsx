import { useState, useEffect, useRef } from 'react';
import { CalendarClock, Copy, Check, RefreshCw, Power, Link2, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { toast } from 'sonner';
import {
  generateIcsToken, icsFeedUrl, connectGoogleCalendar,
  consumePendingImport, getProviderToken, importGoogleEvents,
} from '../../lib/googleCalendar.js';

/**
 * Settings card for two-way calendar sync:
 *   - EXPORT: an ICS feed URL (subscribe from Google/Apple/Outlook) gated by a
 *     rotatable per-user token (profiles.ics_token).
 *   - IMPORT: opt-in Google Calendar connect → events become tasks/classes.
 *
 * Everything degrades gracefully when unconfigured: enabling the feed writes the
 * migration-002 column (surfacing a toast if 002 hasn't run); connect works but
 * import throws a clear "reconnect/grant access" error until the OAuth scope is
 * live. Not part of the main Settings <form> — it uses its own context actions.
 */
export default function CalendarSyncCard() {
  const { settings, setCalendarSync, activeSemester, addTask, addTimetableEntry } = useApp();
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const attempted = useRef(false);

  const token = settings.icsToken;
  const feedUrl = token ? icsFeedUrl(token) : '';

  // Returning from the Google OAuth redirect: if we kicked off a connect, try the
  // import once the session (with provider_token) is available.
  useEffect(() => {
    if (attempted.current) return;
    if (!consumePendingImport()) return;
    attempted.current = true;
    setCalendarSync({ calendarConnected: true });
    runImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runImport = async () => {
    setImporting(true);
    try {
      const providerToken = await getProviderToken();
      const { tasks, classes } = await importGoogleEvents({
        providerToken, activeSemester, addTask, addTimetableEntry,
      });
      if (tasks + classes === 0) {
        toast.info('No new calendar events found in your active semester window.');
      } else {
        toast.success(`Imported ${tasks} task${tasks === 1 ? '' : 's'} and ${classes} class${classes === 1 ? '' : 'es'} from Google Calendar.`);
      }
    } catch (err) {
      toast.error(err.message || 'Google Calendar import failed.');
    } finally {
      setImporting(false);
    }
  };

  const connect = async () => {
    try {
      await connectGoogleCalendar(); // redirects away
    } catch (err) {
      toast.error(err.message || 'Could not start Google sign-in.');
    }
  };

  const enableFeed = () => setCalendarSync({ icsToken: generateIcsToken() });
  const rotate = () => setCalendarSync({ icsToken: generateIcsToken() });
  const disableFeed = () => setCalendarSync({ icsToken: null });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy — select the URL and copy manually.');
    }
  };

  return (
    <div className="glass-card">
      <div className="card-body p-4 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <CalendarClock size={16} className="text-primary" /> Calendar Sync
        </h2>

        {/* EXPORT — ICS feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subscribe to your deadlines</span>
            {token && (
              <span className="badge badge-success badge-sm gap-1"><Check size={11} /> On</span>
            )}
          </div>
          <p className="text-xs text-base-content/50">
            A private link your calendar app checks for updates. Add it in Google/Apple/Outlook via “Subscribe from URL”.
          </p>

          {token ? (
            <>
              <div className="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100/50 px-3 py-2">
                <Link2 size={14} className="text-base-content/40 shrink-0" />
                <input
                  readOnly
                  value={feedUrl}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 bg-transparent text-xs font-mono truncate focus:outline-none"
                  aria-label="Calendar subscription URL"
                />
                <button type="button" onClick={copy} className="btn btn-ghost btn-xs gap-1" aria-label="Copy subscription URL">
                  {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={rotate} className="btn btn-ghost btn-xs gap-1">
                  <RefreshCw size={12} /> Regenerate link
                </button>
                <button type="button" onClick={disableFeed} className="btn btn-ghost btn-xs gap-1 text-error">
                  <Power size={12} /> Turn off
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={enableFeed} className="btn btn-primary pressable gap-2 w-fit">
              <CalendarClock size={14} /> Enable calendar feed
            </button>
          )}
        </div>

        <div className="divider my-0" />

        {/* IMPORT — Google Calendar connect */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Import from Google Calendar</span>
            {settings.calendarConnected && (
              <span className="badge badge-ghost badge-sm gap-1"><Check size={11} /> Connected</span>
            )}
          </div>
          <p className="text-xs text-base-content/50">
            Pull events from your primary Google Calendar into your planner and timetable (one-off events → tasks, recurring → classes).
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={connect} className="btn btn-outline pressable gap-2">
              <Link2 size={14} />
              {settings.calendarConnected ? 'Reconnect' : 'Connect Google Calendar'}
            </button>
            {settings.calendarConnected && (
              <button type="button" onClick={runImport} disabled={importing} className="btn btn-ghost pressable gap-1">
                <Download size={13} /> {importing ? 'Importing…' : 'Import now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
