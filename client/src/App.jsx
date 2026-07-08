import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout';
import { isThemeSweepActive } from './hooks/useThemeTransition.js';

// Login stays eager — it's the first paint for signed-out users. Everything
// else is route-split so the initial bundle stays lean on mobile/PWA first
// load; the service worker precaches every chunk, so navigations after
// install are instant and offline still works.
import Login from './pages/Login';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Grades = lazy(() => import('./pages/Grades'));
const Timetable = lazy(() => import('./pages/Timetable'));
const Planner = lazy(() => import('./pages/Planner'));
const Immigration = lazy(() => import('./pages/Immigration'));
const StudentResources = lazy(() => import('./pages/StudentResources'));
const Settings = lazy(() => import('./pages/Settings'));

// Matches the hydration spinner in RequireStudentType so a code-split page
// loading reads as the same "one moment" state everywhere.
function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireStudentType({ children }) {
  const { settings, isLoaded } = useApp();
  // Wait for Supabase hydration before deciding — otherwise studentType is
  // briefly null during load and we'd bounce an existing user to /onboarding
  // every visit (the "asks for student type every time" bug).
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  if (!settings.studentType) return <Navigate to="/onboarding" replace />;
  return children;
}

function InternationalOnly() {
  const { settings } = useApp();
  if (settings.studentType === 'domestic') return <Navigate to="/resources" replace />;
  return <Immigration />;
}

function DomesticOnly() {
  const { settings } = useApp();
  if (settings.studentType === 'international') return <Navigate to="/immigration" replace />;
  return <StudentResources />;
}

export default function App() {
  const { settings } = useApp();

  // Reconcile the persisted theme onto <html> (initial load + external changes).
  // Guarded so it never re-writes a value the theme-transition hook already applied
  // mid-sweep — a redundant write would desync the active reveal.
  useEffect(() => {
    // Never write while a sweep is composing: this effect fires from the
    // sweep's own debounced persist, and a setAttribute outside the transition
    // callback mutates the live page mid-reveal. The sweep's finish handler
    // settles the attribute itself.
    if (isThemeSweepActive()) return;
    // Coerce any removed/legacy theme (e.g. the retired 'ultragrade-dark') to the
    // default so a returning user never lands on a theme that no longer exists.
    const valid = ['ultragrade-classic', 'ultragrade-light'];
    const next = valid.includes(settings.theme) ? settings.theme : 'ultragrade-classic';
    if (document.documentElement.getAttribute('data-theme') !== next) {
      document.documentElement.setAttribute('data-theme', next);
    }
  }, [settings.theme]);

  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <RequireStudentType>
              <ErrorBoundary>
                <Layout />
              </ErrorBoundary>
            </RequireStudentType>
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="grades" element={<Grades />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="planner" element={<Planner />} />
        <Route path="immigration" element={<InternationalOnly />} />
        <Route path="resources" element={<DomesticOnly />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
