import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CalendarCheck, CalendarDays, FileUp, GraduationCap, Link2, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { calcSemesterGPA } from '../utils/gradeCalculations.js';
import { formatTime, inferSemesterDates } from '../utils/dateHelpers.js';
import { getNextActions } from '../utils/commandCenter.js';
import Modal from '../components/ui/Modal.jsx';
import { ActionRow, EmptyState, Metric, SectionHeader, StatusPill, Surface, TimelineItem } from '../components/ui/CommandPrimitives.jsx';

function AddSemesterModal({ open, onClose }) {
  const { addSemester, setActiveSemester } = useApp();
  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm({ defaultValues: { name: '', startDate: '', endDate: '' } });
  const nameReg = register('name', { required: 'Required' });
  const submit = (data) => { const semester = addSemester(data); setActiveSemester(semester.id); reset(); onClose(); };
  const fillDates = (event) => {
    const inferred = inferSemesterDates(event.target.value);
    if (inferred && !getValues('startDate') && !getValues('endDate')) { setValue('startDate', inferred.startDate); setValue('endDate', inferred.endDate); }
  };
  return <Modal isOpen={open} onClose={onClose} title="Create a semester" size="sm"><form onSubmit={handleSubmit(submit)} className="space-y-4"><div><label className="semantic-label block mb-2">Semester name</label><input {...nameReg} onChange={(event) => { nameReg.onChange(event); fillDates(event); }} className="input input-bordered w-full" placeholder="e.g. Fall 2026" />{errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}</div><div className="grid grid-cols-2 gap-3"><div><label className="semantic-label block mb-2">Starts</label><input type="date" {...register('startDate')} className="input input-bordered w-full" /></div><div><label className="semantic-label block mb-2">Ends</label><input type="date" {...register('endDate')} className="input input-bordered w-full" /></div></div><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button><button className="btn btn-primary">Create semester</button></div></form></Modal>;
}

const dateKey = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function Dashboard() {
  const { semesters, activeSemester, activeCourses, activeTasks, activeTimetable, settings } = useApp();
  const [addSemesterOpen, setAddSemesterOpen] = useState(false);
  const navigate = useNavigate();
  const now = new Date();
  const today = dateKey(now);
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const name = settings.studentName || 'there';
  const courseMap = useMemo(() => Object.fromEntries(activeCourses.map(course => [course.id, course])), [activeCourses]);
  const todaySchedule = useMemo(() => activeTimetable.filter(entry => entry.dayOfWeek === now.getDay()).sort((a, b) => a.startTime.localeCompare(b.startTime)), [activeTimetable, now]);
  const todayTasks = useMemo(() => activeTasks.filter(task => !task.completed && task.dueDate === today), [activeTasks, today]);
  const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
  const gradedItems = activeCourses.flatMap(course => (course.categories || []).flatMap(category => category.grades || [])).length;
  const actions = getNextActions({ tasks: activeTasks, courses: activeCourses, settings, now }).map(item => ({
    ...item,
    icon: { permit: ShieldCheck, deadline: CalendarCheck, outline: FileUp, calendar: Link2 }[item.key],
    action: { permit: 'Life Hub', deadline: 'Plan', outline: 'Import', calendar: 'Connect' }[item.key],
    onClick: () => navigate(item.to),
  }));

  if (!semesters.length) return <div className="command-page command-empty-page"><Surface elevated className="max-w-xl mx-auto p-7 md:p-10 text-center"><StatusPill tone="primary">Start here</StatusPill><h1 className="display-title text-4xl mt-5">Build a calmer term.</h1><p className="text-base-content/60 leading-6 mt-4">Create a semester first. ultraGrade will then turn your courses, deadlines, and schedule into a focused daily view.</p><button type="button" onClick={() => setAddSemesterOpen(true)} className="btn btn-primary rounded-full mt-7 gap-2"><Plus size={16} /> Create a semester</button></Surface><AddSemesterModal open={addSemesterOpen} onClose={() => setAddSemesterOpen(false)} /></div>;

  return <div className="command-page">
    <header className="command-header"><div><p className="semantic-label">{now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}{activeSemester ? ` · ${activeSemester.name}` : ''}</p><h1 className="display-title mt-2">{greeting}, {name}<span className="text-primary">.</span></h1><div className="flex flex-wrap gap-2 mt-4">{settings.studentType === 'international' && <StatusPill tone="primary">International student</StatusPill>}{settings.calendarConnected && <StatusPill tone="success"><span className="status-dot" /> Calendar connected</StatusPill>}</div></div><button type="button" onClick={() => window.dispatchEvent(new Event('ug:assistant'))} className="btn btn-primary rounded-full gap-2 command-ask"><Sparkles size={16} /> Ask ultraGrade</button></header>
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.78fr)] gap-5">
      <div className="space-y-5">
        <Surface elevated className="hero-surface p-5 md:p-7"><p className="semantic-label">Your next move, in one place</p><h2 className="text-2xl md:text-[2rem] font-semibold tracking-[-0.04em] leading-tight max-w-xl mt-2">Ask once. Know what matters. Act before it becomes stressful.</h2><button type="button" onClick={() => window.dispatchEvent(new Event('ug:assistant'))} className="hero-prompt mt-6"><Sparkles size={18} className="text-primary" /><span>What do you need help with?</span><kbd>⌘ K</kbd></button><div className="flex flex-wrap gap-2 mt-3">{['What is due next?', 'Import my outline', 'Plan my week', 'Find my professor'].map(prompt => <button type="button" key={prompt} onClick={() => { window.dispatchEvent(new Event('ug:assistant')); }} className="prompt-chip">{prompt}</button>)}</div></Surface>
        <section><SectionHeader eyebrow="Today at a glance" title="The useful version of your schedule" action={<Link to="/timetable" className="text-xs font-semibold text-primary">Full timetable</Link>} />{todaySchedule.length || todayTasks.length ? <Surface className="p-2">{todaySchedule.map(entry => <TimelineItem key={entry.id} time={formatTime(entry.startTime)} title={entry.label} detail={[entry.location, entry.professor].filter(Boolean).join(' · ')} tone="primary" />)}{todayTasks.map(task => <TimelineItem key={task.id} time={task.dueTime && task.dueTime !== '23:59' ? formatTime(task.dueTime) : 'Today'} title={task.title} detail={`${courseMap[task.courseId]?.code || 'Personal'} deadline`} tone="warning" />)}</Surface> : <Surface><EmptyState title="No commitments scheduled today" detail="Add a class or task, or connect your calendar to make this view useful." action={<button type="button" onClick={() => navigate('/connections')} className="btn btn-ghost btn-sm rounded-full">Open connections</button>} /></Surface>}</section>
        <section><SectionHeader eyebrow="Academic pulse" title="Progress without the noise" action={<Link to="/grades" className="text-xs font-semibold text-primary">Open grades</Link>} /><Surface className="grid grid-cols-3 divide-x divide-base-content/8"><Metric label="Term GPA" value={gpa === null ? '—' : gpa.toFixed(2)} detail={gpa === null ? 'Add a grade to begin' : 'current estimate'} accent /><Metric label="Courses" value={activeCourses.length} detail="active this term" /><Metric label="Assessed" value={gradedItems} detail={gradedItems === 1 ? 'item recorded' : 'items recorded'} /></Surface></section>
      </div>
      <aside className="command-aside space-y-5"><section><SectionHeader eyebrow="Next best actions" title="Stay ahead, quietly" />{actions.length ? <Surface className="command-actions p-2 space-y-1">{actions.map(item => <ActionRow key={item.title} {...item} />)}</Surface> : <Surface><EmptyState title="You’re in good shape" detail="No urgent setup or deadlines need your attention." action={<Link to="/planner" className="btn btn-ghost btn-sm rounded-full">Review planner</Link>} /></Surface>}</section><section><SectionHeader eyebrow="Student advantage" title={settings.studentType === 'international' ? 'One decision, sourced' : 'Support that fits the term'} /><Surface className="command-advantage p-5"><StatusPill tone="primary">{settings.studentType === 'international' ? 'Immigration' : 'Student support'}</StatusPill><h3 className="font-semibold mt-3">{settings.studentType === 'international' ? 'Keep official guidance close to your next decision.' : 'Find support before the week gets heavy.'}</h3><p className="command-advantage-copy text-sm text-base-content/60 leading-6 mt-2">{settings.studentType === 'international' ? 'Review work conditions, your recorded permit date, and official sources alongside the rest of your academic context.' : 'Financial, wellness, and career resources are organised in one calm place—not buried in a portal.'}</p><button type="button" onClick={() => navigate(settings.studentType === 'international' ? '/life?tab=immigration' : '/life?tab=resources')} className="text-sm font-semibold text-primary mt-4">Open Life Hub →</button></Surface></section></aside>
    </div>
    <AddSemesterModal open={addSemesterOpen} onClose={() => setAddSemesterOpen(false)} />
  </div>;
}
