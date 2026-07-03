const COLOR_MAP = {
  primary: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-2) 100%)',
  accent:  'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
  green:   'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
  yellow:  'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)',
  red:     'linear-gradient(90deg, #EF4444 0%, #F87171 100%)',
  purple:  'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
  blue:    'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
};

const ProgressBar = ({ value = 0, max = 100, color = 'primary', showLabel = true, height = 'h-2' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      <div className={`progress-track ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%`, background: COLOR_MAP[color] || COLOR_MAP.primary }}
        />
      </div>
      {showLabel && <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-3)' }}>{pct}%</p>}
    </div>
  );
};
export default ProgressBar;