import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import InfoSection from '../components/immigration/InfoSection';
import WorkRightsTable from '../components/immigration/WorkRightsTable';
import ResourceCard from '../components/immigration/ResourceCard';
import Header from '../components/layout/Header.jsx';
import { API_BASE_URL } from '../lib/apiBase';
import { Shield, Briefcase, Award, Heart, BookOpen, ExternalLink, AlertTriangle, Globe } from 'lucide-react';

const SECTIONS = [
  { key: 'study-permit', title: 'Study Permit', icon: Shield },
  { key: 'work-rights', title: 'Working While Studying', icon: Briefcase },
  { key: 'pgwp', title: 'Post-Graduation Work Permit (PGWP)', icon: Award },
  { key: 'ohip', title: 'OHIP & Health Coverage', icon: Heart },
];

const QUICK_LINKS = [
  { title: 'IRCC – Immigration Portal', url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html', description: 'Official Government of Canada immigration website', icon: Shield },
  { title: 'Apply / Check Application Status', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application.html', description: 'Submit or track your permit applications', icon: Award },
  { title: 'Ontario OHIP Eligibility', url: 'https://www.ontario.ca/page/apply-ohip-and-get-health-card', description: 'Learn when you qualify for provincial health coverage', icon: Heart },
  { title: 'IRCC Webchat (Live Support)', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/contact-ircc/client-support-centre.html', description: 'Chat with an IRCC agent online', icon: BookOpen },
];

function useImmigrationData() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});

  const fetchSection = useCallback(async (section, force = false) => {
    setLoading(l => ({ ...l, [section]: true }));
    try {
      const url = force ? `${API_BASE_URL}/api/immigration/${section}?force=true` : `${API_BASE_URL}/api/immigration/${section}`;
      // Never let a slow upstream hang the UI — force refresh awaits a live fetch (~7s server cap).
      const res = await axios.get(url, { timeout: force ? 15000 : 12000 });
      setData(d => ({ ...d, [section]: res.data }));
    } catch (err) {
      setData(d => ({
        ...d,
        [section]: { error: 'Could not load data. Check your connection or visit the source directly.', fromFallback: true }
      }));
    } finally {
      setLoading(l => ({ ...l, [section]: false }));
    }
  }, []);

  const fetchAll = useCallback(() => {
    SECTIONS.forEach(s => fetchSection(s.key));
  }, [fetchSection]);

  return { data, loading, fetchSection, fetchAll };
}

export default function Immigration() {
  const { settings } = useApp();
  const { data, loading, fetchSection, fetchAll } = useImmigrationData();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="flex flex-col">
      <Header
        title="Immigration Hub"
        icon={Globe}
        subtitle="Information for international students studying in Ontario."
      />

      <div className="p-4 md:p-6 space-y-6">
      {/* Disclaimer */}
      <div className="glass-card p-4 flex items-start gap-3 border-l-4 border-l-warning animate-fade-up">
        <span className="shrink-0 w-9 h-9 rounded-2xl bg-warning/15 text-warning flex items-center justify-center">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-sm">Always verify with your school's international student office</div>
          <div className="text-xs text-base-content/60 mt-0.5">Information is fetched live from official government sites but may not reflect your specific situation, school policies, or recent changes.</div>
        </div>
      </div>

      {/* Permit expiry reminder */}
      {settings.permitExpiryDate && (
        <div className="glass-card p-4 flex items-center gap-3 text-sm animate-fade-up" style={{ animationDelay: '60ms' }}>
          <Shield size={20} className="text-primary flex-shrink-0" />
          <div>
            <span className="font-medium">Your study permit expiry: </span>
            <span className="font-mono">{settings.permitExpiryDate}</span>
          </div>
        </div>
      )}

      {/* Work rights + Quick links, side by side; columns align to top independently so uneven content never leaves a stretched blank gap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase size={18} className="text-primary" /> Work Rights at a Glance
          </h2>
          <WorkRightsTable />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_LINKS.map(link => (
              <ResourceCard key={link.url} {...link} />
            ))}
          </div>
        </div>
      </div>

      {/* Official info, full width below; collapsed by default so the page opens compact and scannable */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Official Information (Live)</h2>
        <div className="space-y-3">
          {SECTIONS.map(({ key, title, icon }, i) => (
            <InfoSection
              key={key}
              title={title}
              icon={icon}
              data={data[key]}
              loading={loading[key]}
              onRefresh={() => fetchSection(key, true)}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
