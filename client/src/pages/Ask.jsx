import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader, Sparkles } from 'lucide-react';
import { useQuickAdd } from '../components/quickadd/useQuickAdd.js';
import { QuickAddPreview } from '../components/quickadd/CommandPalette.jsx';
import { StatusPill, Surface } from '../components/ui/CommandPrimitives.jsx';

const SUGGESTIONS = ['My essay is due Friday at 5 pm', 'Move my project to Monday', 'Add a 92% lab grade', 'What should I do next?'];

export default function Ask() {
  const quickAdd = useQuickAdd();
  const [text, setText] = useState('');
  const [committed, setCommitted] = useState(false);
  const submit = (value = text) => { setCommitted(false); quickAdd.submit(value); };
  const commit = () => { quickAdd.commit(); setCommitted(true); };
  return <div className="command-page max-w-3xl"><Link to="/" className="back-link">← Return home</Link><header className="mt-8 mb-8"><StatusPill tone="primary">AI assistant</StatusPill><h1 className="display-title mt-3">Ask once. Know what matters.</h1><p className="text-base-content/60 mt-3 max-w-xl">Describe the outcome you want. ultraGrade previews every task, grade, class, completion, or reschedule before it changes your plan.</p></header><Surface elevated className="p-5 md:p-7"><div className="assistant-input"><Sparkles size={18} className="text-primary" /><input value={text} onChange={(event) => { setText(event.target.value); if (quickAdd.status === 'error') quickAdd.reset(); }} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="What do you need help with?" aria-label="Ask ultraGrade" disabled={quickAdd.status === 'loading'} /><button type="button" onClick={() => submit()} className="btn btn-primary btn-sm rounded-full" disabled={!text.trim() || quickAdd.status === 'loading'}>{quickAdd.status === 'loading' ? <Loader size={15} className="animate-spin" /> : 'Preview'}</button></div>{quickAdd.status === 'error' && <p className="text-sm text-error flex gap-2 mt-4" role="alert"><AlertCircle size={16} /> {quickAdd.error}</p>}{quickAdd.status === 'preview' && quickAdd.items?.length ? <div className="mt-6"><QuickAddPreview items={quickAdd.items} canCommit={quickAdd.canCommit} onBack={quickAdd.reset} onCommit={commit} />{committed && <p className="text-sm text-success mt-4" role="status">Saved to your plan. You can keep asking or return home.</p>}</div> : <div className="mt-6"><p className="semantic-label mb-3">Try a specific outcome</p><div className="flex flex-wrap gap-2">{SUGGESTIONS.map(suggestion => <button type="button" key={suggestion} onClick={() => { setText(suggestion); submit(suggestion); }} className="prompt-chip">{suggestion}</button>)}</div><p className="text-xs text-base-content/45 mt-6">AI changes are previewed first. You stay in control of what is created, completed, or rescheduled.</p></div>}</Surface><div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"><Link to="/planner" className="command-link-card">Review your planner <ArrowRight size={14} /></Link><Link to="/grades" className="command-link-card">Check grades <ArrowRight size={14} /></Link><Link to="/life" className="command-link-card">Open Life Hub <ArrowRight size={14} /></Link></div></div>;
}
