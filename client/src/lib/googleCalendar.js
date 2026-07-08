import { supabase } from './supabase.js';
import { API_BASE_URL } from './apiBase.js';

/**
 * Google Calendar (import) + ICS feed (export) helpers.
 *
 * IMPORT is opt-in and needs external config (E.1/E.2): the Google OAuth consent
 * screen must expose the calendar.readonly scope and Supabase's Google provider
 * must request it. Until then the connect flow still runs but Google won't return
 * a provider_token with calendar access, and importGoogleEvents throws a clear
 * "reconnect" error — the app degrades gracefully.
 */

const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const PENDING_KEY = 'ug_gcal_pending_import';

/** A 32-char hex secret for the ICS feed URL (>=16 as the route requires). */
export function generateIcsToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

/** Absolute subscribe URL for a token. Requires VITE_API_URL in production. */
export function icsFeedUrl(token) {
  const base = API_BASE_URL || window.location.origin;
  return `${base}/api/calendar/${token}.ics`;
}

/** Kick off Google OAuth re-consent with the calendar scope, returning to /settings. */
export async function connectGoogleCalendar() {
  localStorage.setItem(PENDING_KEY, '1');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: CAL_SCOPE,
      queryParams: { access_type: 'offline', prompt: 'consent' },
      redirectTo: `${window.location.origin}/settings`,
    },
  });
  if (error) {
    localStorage.removeItem(PENDING_KEY);
    throw error;
  }
}

export function consumePendingImport() {
  const pending = localStorage.getItem(PENDING_KEY) === '1';
  if (pending) localStorage.removeItem(PENDING_KEY);
  return pending;
}

/** The Google API access token from the current session, if the scope was granted. */
export async function getProviderToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.provider_token || null;
}

function hhmm(dateTime) {
  const d = new Date(dateTime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isoDate(dateTime) {
  const d = new Date(dateTime);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Import events from the user's primary Google Calendar within the semester
 * window. Non-recurring events → tasks (deadlines). Recurring events → one
 * timetable entry per series (deduped by recurringEventId).
 *
 * @returns {Promise<{ tasks: number, classes: number }>}
 */
export async function importGoogleEvents({ providerToken, activeSemester, addTask, addTimetableEntry }) {
  if (!providerToken) {
    throw new Error('Google did not grant calendar access. Click Connect and approve the Calendar permission.');
  }

  const now = new Date();
  const timeMin = activeSemester?.startDate
    ? new Date(activeSemester.startDate).toISOString()
    : new Date(now.getFullYear(), 0, 1).toISOString();
  const timeMax = activeSemester?.endDate
    ? new Date(new Date(activeSemester.endDate).getTime() + 86400000).toISOString()
    : new Date(now.getFullYear() + 1, 0, 1).toISOString();

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '250');

  const res = await fetch(url, { headers: { Authorization: `Bearer ${providerToken}` } });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Calendar access expired or was not granted. Please reconnect Google Calendar.');
  }
  if (!res.ok) throw new Error('Could not reach Google Calendar. Try again.');

  const { items = [] } = await res.json();

  let tasks = 0;
  const seenSeries = new Set();
  let classes = 0;

  for (const ev of items) {
    if (ev.status === 'cancelled' || !ev.start) continue;
    const startDT = ev.start.dateTime || ev.start.date;
    if (!startDT) continue;

    if (ev.recurringEventId) {
      // A recurring instance → one timetable entry per series.
      if (seenSeries.has(ev.recurringEventId)) continue;
      seenSeries.add(ev.recurringEventId);
      if (!ev.start.dateTime) continue; // all-day recurring — not a class slot
      addTimetableEntry({
        label: ev.summary || 'Class',
        dayOfWeek: new Date(ev.start.dateTime).getDay(),
        startTime: hhmm(ev.start.dateTime),
        endTime: ev.end?.dateTime ? hhmm(ev.end.dateTime) : hhmm(ev.start.dateTime),
        location: ev.location || '',
        type: 'lecture',
      });
      classes += 1;
    } else {
      // One-off event → a dated task.
      addTask({
        title: ev.summary || 'Event',
        type: 'assignment',
        dueDate: isoDate(startDT),
        dueTime: ev.start.dateTime ? hhmm(ev.start.dateTime) : '23:59',
      });
      tasks += 1;
    }
  }

  return { tasks, classes };
}
