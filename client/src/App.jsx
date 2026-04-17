import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/layout/Layout';

import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Timetable from './pages/Timetable';
import Planner from './pages/Planner';
import Immigration from './pages/Immigration';
import StudentResources from './pages/StudentResources';
import Settings from './pages/Settings';

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

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'ultragrade-dark');
  }, [settings.theme]);

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/*"
        element={
          <RequireStudentType>
            <Layout />
          </RequireStudentType>
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
