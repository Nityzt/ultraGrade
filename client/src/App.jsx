import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout';
import { applyThemeToDocument } from './hooks/useThemeTransition.js';

// Login stays eager — it's the first paint for signed-out users. Everything
// else is route-split so the initial bundle stays lean on mobile/PWA first
// load; the service worker precaches every chunk, so navigations after
// install are instant and offline still works.
import Login from './pages/Login';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import { AskUltraGrade } from './components/demo/DemoAssistant.jsx';
import DemoWalkthrough from './components/demo/DemoWalkthrough.jsx';
import DemoProvider from './demo/DemoProvider.jsx';

const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Grades = lazy(() => import('./pages/Grades'));
const Timetable = lazy(() => import('./pages/Timetable'));
const Planner = lazy(() => import('./pages/Planner'));
const Settings = lazy(() => import('./pages/Settings'));
const DemoCommandCenter = lazy(() => import('./pages/DemoCommandCenter'));
const LifeHub = lazy(() => import('./pages/LifeHub'));
const Connections = lazy(() => import('./pages/Connections'));
const DemoProfile = lazy(() => import('./pages/DemoProfile'));
const Ask = lazy(() => import('./pages/Ask'));
const Profile = lazy(() => import('./pages/Profile'));

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
  return <Navigate to={settings.studentType === 'domestic' ? '/life?tab=resources' : '/life?tab=immigration'} replace />;
}

function DomesticOnly() {
  const { settings } = useApp();
  return <Navigate to={settings.studentType === 'international' ? '/life?tab=immigration' : '/life?tab=resources'} replace />;
}

export default function App() {
  const { settings } = useApp();

  // Reconcile the persisted theme onto <html> (initial load + external
  // changes, e.g. settings loaded from another device). Unknown/legacy themes
  // fall back to dark.
  useEffect(() => {
    applyThemeToDocument(settings.theme);
  }, [settings.theme]);

  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/demo" element={<DemoProvider><DemoWalkthrough><Layout demo /></DemoWalkthrough></DemoProvider>}>
        <Route index element={<DemoCommandCenter />} />
        <Route path="ask" element={<AskUltraGrade />} />
        <Route path="life" element={<LifeHub />} />
        <Route path="connections" element={<Connections />} />
        <Route path="profile" element={<DemoProfile />} />
        <Route path="grades" element={<Grades />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="planner" element={<Planner />} />
        <Route path="immigration" element={<LifeHub />} />
        <Route path="resources" element={<LifeHub />} />
        <Route path="settings" element={<DemoProfile />} />
      </Route>
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
        <Route path="ask" element={<Ask />} />
        <Route path="life" element={<LifeHub />} />
        <Route path="connections" element={<Connections />} />
        <Route path="profile" element={<Profile />} />
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
