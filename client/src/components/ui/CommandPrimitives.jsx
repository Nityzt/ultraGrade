import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Surface({ className = '', elevated = false, children }) {
  return <section className={`surface ${elevated ? 'surface-accent' : ''} ${className}`}>{children}</section>;
}

export function StatusPill({ children, tone = 'default', className = '' }) {
  return <span className={`status-pill status-pill-${tone} ${className}`}>{children}</span>;
}

export function SectionHeader({ eyebrow, title, action, children }) {
  return <div className="flex items-end justify-between gap-4 mb-3">
    <div>
      {eyebrow && <p className="semantic-label mb-1">{eyebrow}</p>}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children && <p className="text-sm text-base-content/55 mt-1">{children}</p>}
    </div>
    {action}
  </div>;
}

export function ActionRow({ icon: Icon, title, detail, action, tone = 'primary', onClick, href, to }) {
  const body = <>
    <span className={`action-icon action-icon-${tone}`}><Icon size={18} /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="action-row-detail block text-xs text-base-content/55 mt-0.5 truncate">{detail}</span></span>
    {action && <span className="text-xs font-semibold text-primary">{action}</span>}
    <ChevronRight size={16} className="text-base-content/35 shrink-0" />
  </>;
  const cls = 'action-row pressable';
  if (to) return <Link to={to} className={cls}>{body}</Link>;
  return href ? <a href={href} className={cls}>{body}</a> : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

export function Metric({ label, value, detail, accent = false }) {
  return <div className="metric"><span className="semantic-label">{label}</span><strong className={accent ? 'text-primary' : ''}>{value}</strong>{detail && <span className="text-xs text-base-content/55">{detail}</span>}</div>;
}

export function TimelineItem({ time, title, detail, tone = 'default', children }) {
  return <div className="timeline-item"><span className={`timeline-dot timeline-dot-${tone}`} /><div className="w-14 shrink-0 text-xs font-medium text-base-content/50">{time}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p>{detail && <p className="text-xs text-base-content/55 mt-0.5">{detail}</p>}{children}</div></div>;
}

export function EmptyState({ title, detail, action }) {
  return <div className="command-empty"><p className="font-semibold">{title}</p><p className="text-sm text-base-content/55 mt-1">{detail}</p>{action && <div className="mt-3">{action}</div>}</div>;
}
