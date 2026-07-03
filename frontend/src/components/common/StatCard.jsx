const COLOR_MAP = {
  primary: { text: 'var(--primary)',  bg: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: 'color-mix(in srgb, var(--primary) 25%, transparent)' },
  green:   { text: 'var(--success)',  bg: 'color-mix(in srgb, #10B981 10%, transparent)',         border: 'color-mix(in srgb, #10B981 25%, transparent)'  },
  red:     { text: 'var(--danger)',   bg: 'color-mix(in srgb, var(--danger) 10%, transparent)',   border: 'color-mix(in srgb, var(--danger) 25%, transparent)' },
  yellow:  { text: 'var(--warning)',  bg: 'color-mix(in srgb, var(--warning) 10%, transparent)',  border: 'color-mix(in srgb, var(--warning) 25%, transparent)' },
  purple:  { text: '#8B5CF6',         bg: 'color-mix(in srgb, #8B5CF6 10%, transparent)',         border: 'color-mix(in srgb, #8B5CF6 25%, transparent)'   },
  accent:  { text: 'var(--success)',  bg: 'color-mix(in srgb, var(--success) 10%, transparent)',  border: 'color-mix(in srgb, var(--success) 25%, transparent)' },
  slate:   { text: 'var(--text)',     bg: 'var(--surface-2)',                                      border: 'var(--border)' },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className="card hover:shadow-md transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>{title}</p>
          <p className="text-3xl font-black leading-none" style={{ color: c.text }}>{value ?? '—'}</p>
          {subtitle && <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ml-4"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            <Icon className="w-5 h-5" style={{ color: c.text }} />
          </div>
        )}
      </div>
    </div>
  );
};
export default StatCard;