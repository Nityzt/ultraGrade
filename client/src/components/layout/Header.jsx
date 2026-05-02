import { Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function Header({ title, actions }) {
  const { settings, updateSettings } = useApp();
  const isDark = settings.theme === 'ultragrade-dark';

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-base-300 bg-base-100 sticky top-0 z-30 no-print">
      <h1 className="text-lg font-semibold text-base-content">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        {/* Theme toggle on mobile (desktop has it in sidebar) */}
        <button
          onClick={() => updateSettings({ theme: isDark ? 'ultragrade-light' : 'ultragrade-dark' })}
          className="btn btn-sm btn-ghost btn-circle md:hidden"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
