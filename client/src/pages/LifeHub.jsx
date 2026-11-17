import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, ExternalLink, HeartPulse, Landmark, ShieldCheck, UsersRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ActionRow, EmptyState, SectionHeader, StatusPill, Surface } from '../components/ui/CommandPrimitives.jsx';

const OFFICIAL_WORK_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work.html';
const tabs = ['immigration', 'resources', 'professors'];

export default function LifeHub() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const [tab, setTab] = useState(tabs.includes(requested) ? requested : 'immigration');
  useEffect(() => { if (tabs.includes(requested) && requested !== tab) setTab(requested); }, [requested, tab]);
  const choose = (next) => { setTab(next); setParams({ tab: next }); };
  return <div className="command-page"><header className="mb-7"><p className="semantic-label">Life Hub</p><h1 className="display-title">The things school portals leave out.</h1><p className="text-base-content/60 mt-2 max-w-xl">Immigration guidance, support resources, and professor context—organised around the decision in front of you.</p></header><div role="tablist" aria-label="Life Hub sections" className="segment-control">{tabs.map(item => <button type="button" key={item} role="tab" aria-selected={tab === item} onClick={() => choose(item)}>{item}</button>)}</div><div className="mt-6">{tab === 'immigration' ? <ImmigrationPanel /> : tab === 'resources' ? <ResourcesPanel /> : <ProfessorsPanel />}</div></div>;
}

function ImmigrationPanel() {
  const { settings } = useApp();
  const [reviewed, setReviewed] = useState(false);
  const permitDays = settings.permitExpiryDate ? Math.ceil((new Date(`${settings.permitExpiryDate}T12:00:00`) - new Date()) / 86400000) : null;
  const permitDetail = permitDays === null ? 'Add a date in Profile to track it here' : permitDays <= 0 ? 'The recorded date has passed—verify your status' : `${permitDays} days until ${settings.permitExpiryDate}`;
  return <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.75fr] gap-5"><div className="space-y-5"><Surface elevated className="p-6"><StatusPill tone="primary">Decision support</StatusPill><h2 className="text-2xl font-semibold tracking-tight mt-4">Can I work now?</h2><p className="text-sm leading-6 text-base-content/65 mt-2">Work eligibility depends on the condition printed on your study permit and your current enrolment. Use the official source for the rule, then confirm anything specific with your international student office.</p><div className="flex flex-wrap gap-2 mt-5"><a className="btn btn-primary btn-sm rounded-full" href={OFFICIAL_WORK_URL} target="_blank" rel="noreferrer">Official IRCC source <ExternalLink size={14} /></a><button type="button" onClick={() => setReviewed(true)} className="btn btn-ghost btn-sm rounded-full">{reviewed ? 'Marked reviewed' : 'Mark reviewed'}</button></div></Surface><Surface className="p-2"><ActionRow icon={ShieldCheck} title="What should I verify?" detail="Permit condition · enrolment · scheduled-break rules" action="Review" onClick={() => window.open(OFFICIAL_WORK_URL, '_blank', 'noopener,noreferrer')} /><ActionRow icon={BriefcaseBusiness} title="What expires next?" detail={permitDetail} action="Profile" to="/profile" /><ActionRow icon={HeartPulse} title="How does OHIP fit in?" detail="Coverage can depend on your work and residency situation" action="Source" onClick={() => window.open('https://www.ontario.ca/page/apply-ohip-and-get-health-card', '_blank', 'noopener,noreferrer')} /></Surface></div><Surface className="p-5 h-fit"><p className="semantic-label">Use this responsibly</p><p className="font-semibold mt-2">Official sources, not legal advice.</p><p className="text-sm text-base-content/60 mt-1 leading-6">ultraGrade keeps guidance near your schedule so the next step is clear. It cannot determine your individual status or replace an adviser.</p><p className="text-xs text-base-content/45 mt-5">Check the source date and speak to your school when a decision affects your status.</p></Surface></div>;
}

function ResourcesPanel() { return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"><Resource icon={Landmark} title="Financial support" detail="OSAP, bursaries, emergency funding, and student aid." link="https://www.ontario.ca/page/osap-ontario-student-assistance-program" /><Resource icon={HeartPulse} title="Wellness support" detail="Campus counselling, local care, and urgent support." link="https://www.ontario.ca/page/mental-health-and-addictions-services" /><Resource icon={UsersRound} title="Career & job support" detail="Job search, co-op, and career services for students." link="https://www.jobbank.gc.ca/home" /></div>; }

function Resource({ icon: Icon, title, detail, link }) { return <Surface className="p-5"><span className="action-icon action-icon-primary"><Icon size={18} /></span><h2 className="font-semibold mt-5">{title}</h2><p className="text-sm text-base-content/60 mt-1 leading-6">{detail}</p><a className="text-sm font-semibold text-primary inline-flex mt-5" href={link} target="_blank" rel="noreferrer">Open official resource <ExternalLink size={13} className="ml-1" /></a></Surface>; }

function ProfessorsPanel() {
  const { activeCourses, settings } = useApp();
  const instructors = useMemo(() => activeCourses.filter(course => course.professor?.trim()), [activeCourses]);
  if (!instructors.length) return <Surface><EmptyState title="No instructors linked yet" detail="Add a professor to a course and ultraGrade will keep a school-scoped search close by." action={<a href="/grades" className="btn btn-ghost btn-sm rounded-full">Open grades</a>} /></Surface>;
  const lead = instructors[0];
  const query = encodeURIComponent(`${lead.professor} ${settings.school || ''}`.trim());
  return <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-5"><Surface elevated className="p-6"><StatusPill tone="primary">Course-linked discovery</StatusPill><h2 className="text-2xl font-semibold tracking-tight mt-4">{lead.professor}</h2><p className="text-sm text-base-content/60 mt-1">{lead.code || 'Course'} · {lead.name}</p><p className="text-sm text-base-content/65 leading-6 mt-5">Search results include your school name for useful context. Reviews are personal opinions, so use them alongside the course outline and your own priorities.</p><a className="btn btn-primary btn-sm rounded-full mt-5" href={`https://www.ratemyprofessors.com/search/professors?q=${query}`} target="_blank" rel="noreferrer">Search Rate My Professors <ExternalLink size={14} /></a></Surface><Surface className="p-5"><SectionHeader eyebrow="Linked courses" title="Your instructors" /><div className="space-y-4 text-sm">{instructors.map(course => <p key={course.id}><strong>{course.code || course.name}</strong><br /><span className="text-base-content/55">{course.professor}</span></p>)}</div></Surface></div>;
}
