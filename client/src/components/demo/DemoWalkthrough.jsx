import { useEffect, useState } from 'react';
import { ArrowRight, Compass, Sparkles, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DemoOnboarding from './DemoOnboarding.jsx';

const stops = [
  { route: '/demo', eyebrow: 'Stop 1 · Home', title: 'Start with the overview.', body: 'ultraGrade quietly gathers what matters today, then gives you one place to begin.', action: 'See life context', next: '/demo/life?tab=immigration' },
  { route: '/demo/life?tab=immigration', eyebrow: 'Stop 2 · Life Hub', title: 'School is not the whole story.', body: 'Official immigration guidance, support, and professor discovery stay beside your academic life—not hidden in another portal.', action: 'Meet the assistant', next: '/demo/ask' },
  { route: '/demo/ask', eyebrow: 'Stop 3 · Ask ultraGrade', title: 'Now try a real flow.', body: 'Choose a suggested prompt below. Every result explains what it found before it changes anything.', action: 'Finish tour', next: null },
];

export default function DemoWalkthrough({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  // The demo always starts with a small orientation at its landing route.
  // This is deliberately session-only: reloading /demo restarts the demo.
  const [onboardingOpen, setOnboardingOpen] = useState(() => location.pathname === '/demo');
  const [open, setOpen] = useState(false);
  const stopIndex = stops.findIndex(stop => `${location.pathname}${location.search}` === stop.route);
  const stop = stops[stopIndex < 0 ? 0 : stopIndex];
  useEffect(() => {
    const restart = () => { setOnboardingOpen(false); setOpen(true); navigate('/demo'); };
    window.addEventListener('ug:tour-restart', restart);
    return () => window.removeEventListener('ug:tour-restart', restart);
  }, [navigate]);
  const advance = () => { if (stop.next) navigate(stop.next); else setOpen(false); };
  const finishOnboarding = () => { setOnboardingOpen(false); setOpen(true); };
  // Do not mount the shell behind onboarding. It prevents a Home-route paint
  // followed by an overlay paint, which read as a jitter on fresh demo loads.
  if (onboardingOpen) return <DemoOnboarding onDone={finishOnboarding} />;
  return <>{children}{open && <aside className="demo-walkthrough" role="dialog" aria-label="ultraGrade demo walkthrough" aria-live="polite"><div className="demo-walkthrough-icon">{stopIndex === 2 ? <Sparkles size={18} /> : <Compass size={18} />}</div><button type="button" className="demo-walkthrough-close" onClick={() => setOpen(false)} aria-label="Close walkthrough"><X size={15} /></button><p className="semantic-label">{stop.eyebrow}</p><h2>{stop.title}</h2><p>{stop.body}</p><div className="demo-walkthrough-footer"><div className="demo-walkthrough-progress" aria-label={`Step ${stopIndex + 1} of ${stops.length}`}>{stops.map((item, index) => <span key={item.route} className={index === stopIndex ? 'is-active' : ''} />)}</div><button type="button" className="btn btn-primary btn-sm rounded-full gap-2" onClick={advance}>{stop.action}<ArrowRight size={14} /></button></div></aside>}</>;
}
