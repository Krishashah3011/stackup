const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary', trend }) => {
  const colors = {
    primary: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
    green:   { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/20' },
    red:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
    yellow:  { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/20' },
    purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
    accent:  { bg: 'bg-accent-500/10',  text: 'text-accent-400',  border: 'border-accent-500/20' },
  };

  const c = colors[color] || colors.primary;

  return (
    <div className="card hover:border-slate-700 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${c.text}`}>{value ?? '—'}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center flex-shrink-0 ml-4`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
        </div>
      )}
    </div>
  );
};

export default StatCard;
