import { ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { timeAgo } from '../../utils/dateHelpers';

export default function SourceBadge({ sourceUrl, fetchedAt, onRefresh, loading }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-base-content/50 pt-2 border-t border-base-300 mt-3">
      <span className="flex items-center gap-1">
        <Clock size={12} />
        Last fetched: {fetchedAt ? timeAgo(fetchedAt) : 'unknown'}
      </span>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          Source <ExternalLink size={11} />
        </a>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-50"
      >
        <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
