import { Sun, Moon } from 'lucide-react';
import { useThemeTransition } from '../../hooks/useThemeTransition.js';

export default function Header({ title, actions }) {
  const { isDark, toggle } = useThemeTransition();

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-base-100/70 backdrop-blur-xl border-b border-base-300/50 sticky top-0 z-30 no-print">
      <h1 className="text-xl md:text-2xl font-display font-bold text-base-content tracking-tight">
        {title}<span className="text-primary">.</span>
      </h1>
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={toggle}
          className="btn btn-sm btn-ghost btn-circle md:hidden text-base-content/50 hover:text-primary"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
