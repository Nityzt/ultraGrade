import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import MigrationBanner from './components/migration/MigrationBanner.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Timetable from './pages/Timetable';
import Planner from './pages/Planner';
import Immigration from './pages/Immigration';
import StudentResources from './pages/StudentResources';
import Settings from './pages/Settings';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireStudentType({ children }) {
  const { settings } = useApp();
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
    const next = settings.theme || 'ultragrade-dark';
    if (document.documentElement.getAttribute('data-theme') !== next) {
      document.documentElement.setAttribute('data-theme', next);
    }
  }, [settings.theme]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <MigrationBanner />
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
  );
}
