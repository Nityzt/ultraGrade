export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-base-300/50 flex items-center justify-center mb-4">
          <Icon size={32} className="text-base-content/30" />
        </div>
      )}
      <h3 className="font-semibold text-base-content mb-1">{title}</h3>
      {description && <p className="text-sm text-base-content/50 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
