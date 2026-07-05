/**
 * Shared page header — one typographic voice across every route.
 *
 * Mirrors the dashboard greeting: display-weight title with a sage full-stop
 * accent, muted subtitle, and an optional right-aligned action slot. Fades up
 * on mount so page entrances feel consistent site-wide.
 */
export default function PageHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-fade-up">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight flex items-center gap-2.5">
          {Icon && (
            <span className="w-9 h-9 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-primary" />
            </span>
          )}
          <span className="truncate">
            {title}<span className="text-primary">.</span>
          </span>
        </h1>
        {subtitle && <p className="text-sm text-base-content/50 mt-1.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  );
}
