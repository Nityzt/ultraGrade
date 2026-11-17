import { useEffect, useRef, useState } from 'react';
import { Check, FileUp, MessageCircle, Search, Sparkles, CalendarClock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import { Surface, StatusPill } from '../ui/CommandPrimitives.jsx';
import { useApp } from '../../context/AppContext.jsx';

const prompts = ['Can I work this week?', 'Find my professor', 'Import my syllabus', 'What is due next?'];
const SAMPLE_OUTLINE = { courseCode: 'CSC309', courseName: 'Programming on the Web', professor: 'Dr. Anika Patel', deadlines: [{ title: 'API design checkpoint', date: '2026-10-02', type: 'assignment' }, { title: 'Project presentation', date: '2026-11-27', type: 'assignment' }] };

function getReply(input, app) {
  const text = input.toLowerCase();
  if (/work|permit|immigration/.test(text)) return { type: 'guidance', title: 'You may be able to work off campus', body: 'For this demo persona, the next step is to verify the work condition printed on the study permit and your current enrolment. ultraGrade keeps the official source and your permit date together.', link: '/demo/life?tab=immigration', label: 'Review work rights' };
  if (/professor|anika|rate my/.test(text)) return { type: 'professor', title: 'Professor match found', body: 'Dr. Anika Patel is linked to CSC309. I found a school-scoped Rate My Professors search so you can decide with context.', external: 'https://www.ratemyprofessors.com/search/professors?q=Anika%20Patel%20University%20of%20Toronto', label: 'Open professor search' };
  if (/import|syllabus|outline/.test(text)) { app.importFromOutline(SAMPLE_OUTLINE); return { type: 'import', title: 'Outline ready to merge', body: 'Added 2 deadlines to CSC309. Your existing course, grades, and timetable stay untouched. 1 assessment weight needs review.', label: 'See academic details', link: '/demo/grades' }; }
  if (/complete|finish|proposal/.test(text)) { app.toggleTaskComplete('demo-task-project'); return { type: 'complete', title: 'Project proposal completed', body: 'I marked the CSC309 proposal as complete. Your next best action has updated.', label: 'Open planner', link: '/demo/planner' }; }
  if (/reschedule|move/.test(text)) { app.updateTask('demo-task-project', { dueDate: '2026-09-21', dueTime: '17:00' }); return { type: 'reschedule', title: 'Project proposal rescheduled', body: 'Moved to Monday, Sep 21 at 5:00 PM. No class conflicts found.', label: 'View timeline', link: '/demo/planner' }; }
  return { type: 'due', title: 'Your next deadline is Project proposal', body: 'CSC309 · Friday, Sep 18 at 5:00 PM. It has a high priority because it unlocks your project work.', label: 'Open planner', link: '/demo/planner' };
}

export function AssistantContent({ onDone }) {
  const app = useApp(); const [input, setInput] = useState(''); const [reply, setReply] = useState(null); const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const submit = (value = input) => { if (!value.trim()) return; setInput(value); setReply(getReply(value, app)); };
  return <div className="space-y-5">
    <div className="assistant-input"><Sparkles size={18} className="text-primary" /><input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="What do you need help with?" aria-label="Ask ultraGrade" /><button type="button" onClick={() => submit()} className="btn btn-primary btn-sm rounded-full">Ask</button></div>
    {!reply && <><div><p className="semantic-label mb-2">Suggested prompts</p><div className="flex flex-wrap gap-2">{prompts.map(prompt => <button type="button" key={prompt} onClick={() => submit(prompt)} className="prompt-chip">{prompt}</button>)}</div></div><Surface className="p-4"><p className="semantic-label">Recent action</p><p className="font-semibold text-sm mt-1">Calendar is connected</p><p className="text-xs text-base-content/55 mt-1">Your Google events appear alongside classes. Nothing is written without your approval.</p></Surface></>}
    {reply && <Surface elevated className="p-5 assistant-result" aria-live="polite"><div className="flex gap-3"><span className="action-icon action-icon-primary"><Check size={18} /></span><div className="min-w-0"><StatusPill tone="success">Preview ready</StatusPill><h3 className="font-semibold mt-3">{reply.title}</h3><p className="text-sm leading-6 text-base-content/65 mt-1">{reply.body}</p></div></div><div className="flex flex-wrap gap-2 mt-5">{reply.external ? <a href={reply.external} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm rounded-full">{reply.label} <ArrowRight size={14} /></a> : <Link onClick={onDone} to={reply.link} className="btn btn-primary btn-sm rounded-full">{reply.label} <ArrowRight size={14} /></Link>}<button type="button" onClick={() => { setReply(null); setInput(''); }} className="btn btn-ghost btn-sm rounded-full">Ask another</button></div></Surface>}
    <p className="text-xs text-base-content/45">Demo responses are seeded. Immigration information is general guidance, not legal advice.</p>
  </div>;
}

export default function DemoAssistant() {
  const [open, setOpen] = useState(false); const navigate = useNavigate();
  useEffect(() => { const handler = () => setOpen(true); window.addEventListener('ug:assistant', handler); return () => window.removeEventListener('ug:assistant', handler); }, []);
  return <><button type="button" onClick={() => setOpen(true)} aria-label="Ask ultraGrade" className="demo-ask-fab"><MessageCircle size={18} /><span>Ask</span></button><Modal isOpen={open} onClose={() => setOpen(false)} title="Ask ultraGrade" size="lg"><AssistantContent onDone={() => setOpen(false)} /></Modal></>;
}

export function AskUltraGrade() {
  const navigate = useNavigate();
  return <div className="command-page max-w-3xl"><Link to="/demo" className="back-link">← Return to command center</Link><div className="mt-8 mb-8"><StatusPill tone="primary">AI assistant</StatusPill><h1 className="display-title mt-3">Ask once. Know what matters.</h1><p className="text-base-content/60 mt-3 max-w-xl">Preview the outcome before you create, complete, reschedule, or import anything.</p></div><AssistantContent onDone={() => navigate('/demo')} /></div>;
}
