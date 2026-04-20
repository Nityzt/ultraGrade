import { ExternalLink } from 'lucide-react';

export default function ResourceCard({ title, description, url, icon: Icon, badge }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="card bg-base-200 hover:bg-base-300 transition-colors shadow-sm cursor-pointer group"
    >
      <div className="card-body p-4 flex-row items-start gap-3">
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Icon size={20} className="text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm">{title}</h4>
            {badge && <span className="badge badge-primary badge-xs">{badge}</span>}
            <ExternalLink size={12} className="text-base-content/40 group-hover:text-primary transition-colors ml-auto" />
          </div>
          {description && <p className="text-xs text-base-content/60 mt-1">{description}</p>}
        </div>
      </div>
    </a>
  );
}
