import { useThemeTransition } from '../../hooks/useThemeTransition.js';

export default function Header({ title, actions }) {
  const { meta, nextMeta, toggleProps } = useThemeTransition();
  const ThemeIcon = meta.Icon;

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-base-100/70 backdrop-blur-xl border-b border-base-300/50 sticky top-0 z-30 no-print">
      <h1 className="text-xl md:text-2xl font-display font-bold text-base-content tracking-tight">
        {title}<span className="text-primary">.</span>
      </h1>
      <div className="flex items-center gap-2">
        {actions}
        <button
          {...toggleProps}
          className="btn btn-sm btn-ghost btn-circle md:hidden text-base-content/50 hover:text-primary"
          aria-label={`Theme: ${meta.label}. Click to switch to ${nextMeta.label}`}
          title={`${meta.label} — tap for ${nextMeta.label}`}
        >
          <ThemeIcon size={16} />
        </button>
      </div>
    </header>
  );
}
