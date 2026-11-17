import { CalendarCheck, FileUp, Globe2, Link2, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ActionRow, SectionHeader, StatusPill, Surface, TimelineItem } from '../components/ui/CommandPrimitives.jsx';

const todayItems = [
  { time: '10:00', title: 'CSC309 lecture', detail: 'BA 1170 · Dr. Anika Patel', tone: 'primary' },
  { time: '13:00', title: 'ECO101 lecture', detail: 'SS 2117 · Google Calendar', tone: 'info' },
  { time: '17:00', title: 'Project proposal due', detail: 'CSC309 · high priority', tone: 'warning' },
];

export default function DemoCommandCenter() {
  const { activeTasks } = useApp();
  const navigate = useNavigate();
  const proposal = activeTasks.find(t => t.id === 'demo-task-project');
  const ask = () => window.dispatchEvent(new Event('ug:assistant'));
  const actions = [
    { icon: ShieldCheck, title: 'Can I work this week?', detail: 'Check your permit condition first', action: 'Check', onClick: () => navigate('/demo/life?tab=immigration') },
    { icon: CalendarCheck, title: proposal?.completed ? 'Proposal completed' : 'Project proposal due', detail: proposal?.completed ? 'Your next move is updated' : 'CSC309 · Friday at 5:00 PM', action: proposal?.completed ? 'Done' : 'Plan', onClick: () => navigate('/demo/planner') },
    { icon: FileUp, title: 'Import an outline', detail: 'Add deadlines without duplicate courses', action: 'Import', onClick: ask },
  ];

  return <div className="command-page demo-home">
    <header className="demo-home-header">
      <div><p className="semantic-label">Tuesday, September 15 · Fall 2026</p><h1 className="display-title mt-2">Good morning, Maya<span className="text-primary">.</span></h1></div>
      <div className="flex items-center gap-2"><StatusPill tone="primary"><Globe2 size={13} /> International student</StatusPill><button type="button" className="demo-tour-replay" onClick={() => window.dispatchEvent(new Event('ug:tour-restart'))}>Tour</button></div>
    </header>

    <Surface elevated className="command-stage">
      <div className="command-stage-signal" aria-hidden="true"><span /><span /><span /></div>
      <p className="semantic-label">A calmer way to run student life</p>
      <h2>Meet your<br /><em>student life OS.</em></h2>
      <p className="command-stage-copy">ultraGrade brings your courses, deadlines, official guidance, and useful next moves into one thoughtful place. Take a quick look around—then try it when you’re ready.</p>
      <div className="command-stage-actions"><button type="button" onClick={() => window.dispatchEvent(new Event('ug:tour-restart'))} className="btn btn-primary rounded-full gap-2">Take the guided tour <span>→</span></button><Link to="/demo/ask" className="command-stage-secondary"><Sparkles size={16} /> Explore Ask ultraGrade</Link></div>
    </Surface>

    <div className="demo-home-grid">
      <section><SectionHeader eyebrow="Today, made useful" title="Three things. One clear day." action={<Link to="/demo/timetable" className="text-xs font-semibold text-primary">Open timetable</Link>} /><Surface className="p-2">{todayItems.map(item => <TimelineItem key={item.title} {...item} />)}</Surface></section>
      <section><SectionHeader eyebrow="Start here" title="Your next best moves" action={<Link to="/demo/life" className="text-xs font-semibold text-primary">Life Hub</Link>} /><Surface className="command-actions p-2 space-y-1">{actions.map(item => <ActionRow key={item.title} {...item} />)}<ActionRow icon={Link2} title="Calendar is connected" detail="Google Calendar · synced just now" action="View" onClick={() => navigate('/demo/connections')} /></Surface></section>
    </div>
    <div className="demo-home-footer"><span>Need the detail view?</span><Link to="/demo/grades">Grades</Link><Link to="/demo/planner">Planner</Link><Link to="/demo/life?tab=professors">Find a professor</Link></div>
  </div>;
}
