import { Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function Header({ title, actions }) {
  const { settings, updateSettings } = useApp();
  const isDark = settings.theme === 'ultragrade-dark';

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-base-100/70 backdrop-blur-xl border-b border-base-300/50 sticky top-0 z-30 no-print">
      <h1 className="text-xl md:text-2xl font-display font-bold text-base-content tracking-tight">
        {title}<span className="text-primary">.</span>
      </h1>
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={() => updateSettings({ theme: isDark ? 'ultragrade-light' : 'ultragrade-dark' })}
          className="btn btn-sm btn-ghost btn-circle md:hidden text-base-content/50 hover:text-primary"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
