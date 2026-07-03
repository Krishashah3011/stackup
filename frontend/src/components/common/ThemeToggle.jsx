import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #3B82F6, #60A5FA)'
          : 'linear-gradient(135deg, #EC4899, #F472B6)',
        boxShadow: isDark
          ? '0 2px 8px rgba(59,130,246,0.40)'
          : '0 2px 8px rgba(236,72,153,0.40)',
      }}
      aria-label="Toggle theme"
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none select-none">
        {isDark ? '' : '☀️'}
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none select-none">
        {isDark ? '🌙' : ''}
      </span>
      {/* Thumb */}
      <div
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-xs"
        style={{ left: isDark ? 'calc(100% - 1.625rem)' : '2px' }}
      >
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
};

export default ThemeToggle;
