import { useState } from 'react';
import { ChevronDown, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ContentRenderer({ text }) {
  const blocks = text.split(/\n\n+/).filter(b => b.trim());

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(l => l.trim());
        if (!lines.length) return null;

        const allBullets = lines.every(l => l.startsWith('•'));
        const hasBullets = lines.some(l => l.startsWith('•'));

        if (allBullets) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2 text-sm text-base-content/80">
                  <span className="text-primary font-bold shrink-0 mt-0.5">›</span>
                  <span>{line.slice(1).trim()}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (hasBullets) {
          return (
            <div key={i} className="space-y-1.5">
              {lines.map((line, j) =>
                line.startsWith('•') ? (
                  <div key={j} className="flex gap-2 text-sm text-base-content/80">
                    <span className="text-primary font-bold shrink-0 mt-0.5">›</span>
                    <span>{line.slice(1).trim()}</span>
                  </div>
                ) : (
                  <p key={j} className="text-sm text-base-content/70 font-medium">{line}</p>
                )
              )}
            </div>
          );
        }

        if (lines.length === 1 && lines[0].length <= 80) {
          return (
            <p key={i} className="text-sm font-semibold text-base-content pt-1">
              {lines[0]}
            </p>
          );
        }

        return (
          <p key={i} className="text-sm text-base-content/80 leading-relaxed">
            {lines.join(' ')}
          </p>
        );
      })}
    </div>
  );
}

export default function InfoSection({ title, data, onRefresh, loading, icon: Icon, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-base-content/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-primary" />
            </div>
          )}
          <span className="font-semibold text-sm">{title}</span>

        </div>
        <ChevronDown
          size={16}
          className={`text-base-content/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-base-300 px-4 py-4">
              {loading ? (
                <div className="space-y-2">
                  {[80, 60, 90, 50, 75].map((w, i) => (
                    <div key={i} className="skeleton h-3.5 rounded" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : data?.error ? (
                <p className="text-sm text-error/80">{data.error}</p>
              ) : data?.content ? (
                <ContentRenderer text={data.content} />
              ) : (
                <p className="text-sm text-base-content/40 italic">Loading…</p>
              )}

              {data && !data.error && (
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-base-300 text-xs text-base-content/40">
                  {data.fromFallback ? (
                    <span className="flex items-center gap-1" title="Curated guidance — kept current manually; live gov data loads when reachable">
                      <Clock size={11} /> Curated info
                    </span>
                  ) : data.fetchedAt && (
                    <span className="flex items-center gap-1" title="Fetched from the official source">
                      <Clock size={11} />
                      Verified {new Date(data.fetchedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {data.sourceUrl && (
                    <a
                      href={data.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Source <ExternalLink size={10} />
                    </a>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onRefresh(); }}
                    disabled={loading}
                    className="flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-40 ml-auto"
                  >
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
