import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SourceBadge from './SourceBadge';

export default function InfoSection({ title, data, onRefresh, loading, icon: Icon }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card bg-base-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-base-300 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-primary flex-shrink-0" />}
          <span className="font-semibold">{title}</span>
          {data?.fromFallback && (
            <span className="badge badge-warning badge-xs flex items-center gap-1">
              <AlertTriangle size={10} /> Cached
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-4 w-full rounded" />
                  ))}
                </div>
              ) : data?.error ? (
                <div className="alert alert-error text-sm">{data.error}</div>
              ) : (
                <>
                  <div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-line text-sm leading-relaxed">
                    {data?.content || 'No content available.'}
                  </div>
                  {data && (
                    <SourceBadge
                      sourceUrl={data.sourceUrl}
                      fetchedAt={data.fetchedAt}
                      onRefresh={onRefresh}
                      loading={loading}
                    />
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
