const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && (
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
    )}
    <h3 className="text-slate-300 font-semibold text-lg mb-1">{title}</h3>
    {description && <p className="text-slate-500 text-sm mb-6 max-w-xs">{description}</p>}
    {action && action}
  </div>
);

export default EmptyState;
