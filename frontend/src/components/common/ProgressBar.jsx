const ProgressBar = ({ value = 0, max = 100, color = 'primary', showLabel = true, height = 'h-2' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const colors = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} ${colors[color] || colors.primary} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-400 mt-1 text-right">{pct}%</p>
      )}
    </div>
  );
};

export default ProgressBar;
