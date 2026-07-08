import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, FileText, ScanLine, ListChecks, CalendarClock, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { API_BASE_URL } from '../../lib/apiBase.js';

export default function OutlineImportModal({ isOpen, onClose }) {
  const { importFromOutline, activeSemester } = useApp();
  const [status, setStatus] = useState('idle'); // idle | loading | preview | error
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setStatus('loading');
    setError('');
    try {
      // Fetch a fresh session so an expired access token is refreshed before the
      // request — the token held in context state may have already lapsed.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Your session has expired. Please sign in again.');
        setStatus('error');
        return;
      }

      const formData = new FormData();
      formData.append('outline', file);
      // Give Gemini the semester window so it can resolve relative deadline
      // references ("Week 5", "Oct 12") into real dated calendar entries.
      if (activeSemester?.name) formData.append('semesterName', activeSemester.name);
      if (activeSemester?.startDate) formData.append('semesterStart', activeSemester.startDate);
      if (activeSemester?.endDate) formData.append('semesterEnd', activeSemester.endDate);
      const res = await axios.post(`${API_BASE_URL}/api/parse-outline`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      if (res.data.success) {
        setParsed(res.data.data);
        setStatus('preview');
      } else {
        throw new Error(res.data.error || 'Parse failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to parse outline');
      setStatus('error');
    }
  };

  const handleConfirm = () => {
    importFromOutline(parsed);
    onClose();
    setStatus('idle');
    setParsed(null);
  };

  const reset = () => { setStatus('idle'); setParsed(null); setError(''); };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); reset(); }} title="Import Course Outline" size="md">
      {status === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-base-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload size={32} className="text-base-content/30 mx-auto mb-2" />
            <p className="font-medium text-base-content/70">Drop your course outline here</p>
            <p className="text-sm text-base-content/40 mt-1">PDF, PNG, JPG accepted · Max 10MB</p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <p className="text-xs text-base-content/40 text-center">
            AI will extract course name, schedule, assessment weights, and deadlines. You can review before importing.
          </p>
        </div>
      )}

      {status === 'loading' && <AnalyzingLoader />}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 py-4">
          <AlertCircle size={32} className="text-error" />
          <p className="text-error font-medium">{error}</p>
          <button onClick={reset} className="btn btn-ghost btn-sm">Try Again</button>
        </div>
      )}

      {status === 'preview' && parsed && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle size={18} />
            <span className="font-medium text-sm">Outline parsed successfully</span>
          </div>

          <div className="bg-base-300/30 rounded-xl p-4 flex flex-col gap-3 text-sm">
            {parsed.courseCode && <div className="flex justify-between"><span className="text-base-content/50">Code</span><span className="font-medium">{parsed.courseCode}</span></div>}
            {parsed.courseName && <div className="flex justify-between"><span className="text-base-content/50">Name</span><span className="font-medium">{parsed.courseName}</span></div>}
            {parsed.professor && <div className="flex justify-between"><span className="text-base-content/50">Professor</span><span>{parsed.professor}</span></div>}
            {parsed.creditHours && <div className="flex justify-between"><span className="text-base-content/50">Credits</span><span>{parsed.creditHours}</span></div>}
          </div>

          {parsed.assessments?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-base-content/50 mb-2">ASSESSMENTS</p>
              {parsed.assessments.map((a, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-base-300/50">
                  <span>{a.name}</span><span className="font-mono">{a.weight}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Spell out what lands where, so the import feels predictable. */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="pill px-2.5 py-1 text-base-content/70">{parsed.assessments?.length || 0} grade categories</span>
            <span className="pill px-2.5 py-1 text-base-content/70">{parsed.schedule?.length || 0} timetable slots</span>
            <span className="pill px-2.5 py-1 text-base-content/70">{parsed.deadlines?.length || 0} calendar deadlines</span>
          </div>
          {!parsed.deadlines?.length && (
            <p className="text-xs text-warning/80">
              No dated deadlines were found in this outline — nothing will be added to your calendar. You can add tasks manually in the Planner.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="btn btn-ghost flex-1">Re-upload</button>
            <button onClick={handleConfirm} className="btn btn-primary flex-1">Import to ultraGrade</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* Premium multi-step "analyzing" indicator. We don't get real progress from the
   single Gemini call, so we advance through the pipeline stages on a timer and
   hold on the last one until the response lands — it reads as genuine work and
   sets expectations for what's being extracted. */
const ANALYZE_STEPS = [
  { icon: ScanLine, label: 'Reading your outline' },
  { icon: FileText, label: 'Extracting course details' },
  { icon: ListChecks, label: 'Finding assessment weights' },
  { icon: CalendarClock, label: 'Resolving deadline dates' },
];

function AnalyzingLoader() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => Math.min(i + 1, ANALYZE_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Pulsing brand orb with an orbiting sparkle */}
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-3xl bg-primary/15 border border-primary/25"
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={26} className="text-primary" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        {ANALYZE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i < active;
          const current = i === active;
          return (
            <motion.div
              key={step.label}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done || current ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                done ? 'bg-success/15 text-success'
                  : current ? 'bg-primary/15 text-primary'
                  : 'bg-base-300/40 text-base-content/40'
              }`}>
                {done ? <CheckCircle size={15} />
                  : current ? <Icon size={14} className="animate-pulse-soft" />
                  : <Icon size={14} />}
              </div>
              <span className={`text-sm ${current ? 'font-medium text-base-content' : 'text-base-content/60'}`}>
                {step.label}
                {current && <span className="loading loading-dots loading-xs ml-1.5 align-middle" />}
              </span>
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-base-content/40">This usually takes a few seconds…</p>
    </div>
  );
}
