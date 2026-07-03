const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
    {Icon && (
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}
      >
        <Icon className="w-8 h-8" style={{ color: 'var(--primary)' }} />
      </div>
    )}
    <h3 className="font-bold text-base mb-1.5" style={{ color: 'var(--text)' }}>{title}</h3>
    {description && <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-3)' }}>{description}</p>}
    {action && action}
  </div>
);
export default EmptyState;