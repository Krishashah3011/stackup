import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── SVG Ring (animated) ─────────────────────────────────────────────────────
const Ring = ({ value = 0, size = 96, stroke = 10, color = '#6366f1', trackColor = '#1e293b', label, sublabel }) => {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white leading-none">{value}</span>
          <span className="text-slate-500 text-[10px] leading-none mt-0.5">/ 100</span>
        </div>
      </div>
      {label    && <p className="text-slate-300 text-sm font-medium mt-2">{label}</p>}
      {sublabel && <p className="text-slate-500 text-xs mt-0.5">{sublabel}</p>}
    </div>
  );
};

// ─── MiniBar chart ────────────────────────────────────────────────────────────
const WeeklyChart = ({ data = [] }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((week, i) => {
        const pct = (week.count / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t-sm transition-all duration-700 ${isLast ? 'bg-primary-500' : 'bg-slate-700 group-hover:bg-slate-500'}`}
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              {week.label}: {week.count}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = 'slate', sub }) => {
  const colors = {
    primary: 'text-primary-400',
    green:   'text-green-400',
    red:     'text-red-400',
    yellow:  'text-yellow-400',
    purple:  'text-purple-400',
    accent:  'text-accent-400',
    slate:   'text-slate-200',
  };
  return (
    <div className="card text-center py-4">
      <p className={`text-3xl font-bold ${colors[color] || colors.slate}`}>{value ?? '—'}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
      {sub && <p className="text-slate-600 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
};

// ─── Quick action card ────────────────────────────────────────────────────────
const QUICK_LINKS = [
  {
    to:    '/tracker',
    label: 'Placement Tracker',
    desc:  'Track job applications',
    emoji: '📋',
    color: 'from-blue-600/20 to-blue-900/10 border-blue-500/20 hover:border-blue-500/40',
  },
  {
    to:    '/dsa',
    label: 'DSA Tracker',
    desc:  'Topic-wise problem solving',
    emoji: '💻',
    color: 'from-primary-600/20 to-primary-900/10 border-primary-500/20 hover:border-primary-500/40',
  },
  {
    to:    '/aptitude',
    label: 'Aptitude Tracker',
    desc:  'Score & accuracy tracking',
    emoji: '📊',
    color: 'from-accent-600/20 to-accent-900/10 border-accent-500/20 hover:border-accent-500/40',
  },
  {
    to:    '/interview',
    label: 'AI Interview Prep',
    desc:  'AI-generated questions',
    emoji: '🤖',
    color: 'from-purple-600/20 to-purple-900/10 border-purple-500/20 hover:border-purple-500/40',
  },
  {
    to:    '/resume',
    label: 'Resume Analyzer',
    desc:  'ATS score & suggestions',
    emoji: '📄',
    color: 'from-yellow-600/20 to-yellow-900/10 border-yellow-500/20 hover:border-yellow-500/40',
  },
];

const SUGGESTION_META = {
  tracker:  { emoji: '📋', to: '/tracker' },
  dsa:      { emoji: '💻', to: '/dsa' },
  aptitude: { emoji: '📊', to: '/aptitude' },
  resume:   { emoji: '📄', to: '/resume' },
};

// ─── DSA topic color map ──────────────────────────────────────────────────────
const DSA_COLORS = {
  Arrays:               '#6366f1',
  Strings:              '#10b981',
  'Linked List':        '#a855f7',
  'Stack & Queue':      '#f59e0b',
  Hashing:              '#22c55e',
  Trees:                '#06b6d4',
  Graphs:               '#ef4444',
  'Dynamic Programming':'#8b5cf6',
};

// ─── Readiness badge ──────────────────────────────────────────────────────────
const readinessMeta = (score) => {
  if (score >= 80) return { label: 'Placement Ready',  color: '#10b981', emoji: '🏆' };
  if (score >= 60) return { label: 'Almost There',     color: '#f59e0b', emoji: '🔥' };
  if (score >= 40) return { label: 'In Progress',      color: '#6366f1', emoji: '📈' };
  return               { label: 'Just Getting Started', color: '#94a3b8', emoji: '🚀' };
};

// ─────────────────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await dashboardService.getStats();
        if (mountedRef.current) setStats(data.data);
      } catch {
        if (mountedRef.current) toast.error('Failed to load dashboard data');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-slate-500 text-sm mt-4">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const apps        = stats?.applications  || {};
  const dsa         = stats?.dsa           || {};
  const aptitude    = stats?.aptitude      || {};
  const resume      = stats?.resume        || {};
  const readiness   = stats?.readinessScore ?? 0;
  const rMeta       = readinessMeta(readiness);
  const suggestions = stats?.suggestions   || [];

  const totalApps = apps.total || 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero / Greeting ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900/50 via-slate-900 to-slate-900 border border-primary-800/30 p-6">
        {/* Background glow */}
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm">{greeting()}</p>
            <h2 className="text-2xl font-bold text-white mt-0.5">
              {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Here's your placement preparation overview.
            </p>
          </div>
          {/* Readiness badge */}
          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 flex-shrink-0">
            <span className="text-2xl">{rMeta.emoji}</span>
            <div>
              <p className="text-white font-semibold text-sm">{rMeta.label}</p>
              <p className="text-slate-400 text-xs">Readiness: {readiness}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Readiness + Module scores ─────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-200 font-semibold">Placement Readiness</h3>
          <span className="text-slate-500 text-xs">Weighted across all modules</span>
        </div>
        <div className="flex flex-wrap gap-6 justify-around">
          <Ring
            value={readiness}
            color={rMeta.color}
            label="Overall"
            sublabel="Readiness Score"
          />
          <Ring
            value={dsa.overall || 0}
            color={DSA_COLORS['Arrays']}
            label="DSA"
            sublabel={`${dsa.totalSolved || 0}/${dsa.totalProblems || 0} solved`}
          />
          <Ring
            value={aptitude.overall || 0}
            color="#10b981"
            label="Aptitude"
            sublabel={`${aptitude.avgAccuracy || 0}% accuracy`}
          />
          <Ring
            value={resume.score ?? 0}
            color="#f59e0b"
            label="Resume"
            sublabel={resume.score !== null ? 'ATS Score' : 'Not analyzed'}
          />
        </div>
      </div>

      {/* ── Application stats row ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-200 font-semibold">Applications</h3>
          <Link to="/tracker" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total"     value={apps.total || 0}                   color="slate" />
          <StatCard label="Selected"  value={apps['Selected'] || 0}             color="green" />
          <StatCard label="Rejected"  value={apps['Rejected'] || 0}             color="red" />
          <StatCard label="Interviews" value={apps['Interview Scheduled'] || 0}  color="yellow" />
          <StatCard label="OA Stage"   value={(apps['OA Scheduled'] || 0) + (apps['OA Cleared'] || 0)} color="purple" />
          <StatCard
            label="Win Rate"
            value={apps.conversionRate !== null ? `${apps.conversionRate}%` : '—'}
            color="accent"
            sub="Selected / Decided"
          />
        </div>
      </div>

      {/* ── Weekly trend + DSA breakdown ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weekly application trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium text-sm">Applications This Season</h3>
            <span className="text-slate-600 text-xs">Last 8 weeks</span>
          </div>
          {totalApps > 0 ? (
            <>
              <WeeklyChart data={apps.weeklyTrend || []} />
              <div className="flex items-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-slate-500 text-xs">This week highlighted</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">📤</span>
              <p className="text-slate-500 text-sm">No applications yet</p>
              <Link to="/tracker" className="text-primary-400 text-xs hover:underline mt-1">
                Start applying →
              </Link>
            </div>
          )}
        </div>

        {/* DSA breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium text-sm">DSA Progress by Topic</h3>
            <Link to="/dsa" className="text-primary-400 text-xs hover:text-primary-300 transition-colors">
              Manage →
            </Link>
          </div>
          {dsa.breakdown?.length > 0 ? (
            <div className="space-y-3">
              {dsa.breakdown.map((d) => (
                <div key={d._id || d.topic}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">{d.topic}</span>
                    <span className="text-slate-500">{d.solvedProblems}/{d.totalProblems}</span>
                  </div>
                  <ProgressBar
                    value={d.progress}
                    max={100}
                    showLabel={false}
                    height="h-1.5"
                    color={
                      d.progress >= 75 ? 'accent' :
                      d.progress >= 50 ? 'primary' : 'yellow'
                    }
                  />
                </div>
              ))}
              <p className="text-slate-600 text-xs pt-1">
                {dsa.totalSolved} of {dsa.totalProblems} problems solved across {dsa.topicsTracked} topics
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">💻</span>
              <p className="text-slate-500 text-sm">No DSA topics tracked</p>
              <Link to="/dsa" className="text-primary-400 text-xs hover:underline mt-1">
                Add your first topic →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Aptitude + Resume ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Aptitude breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium text-sm">Aptitude Categories</h3>
            <Link to="/aptitude" className="text-primary-400 text-xs hover:text-primary-300 transition-colors">
              Manage →
            </Link>
          </div>
          {aptitude.breakdown?.length > 0 ? (
            <div className="space-y-3">
              {aptitude.breakdown.map((a) => (
                <div key={a._id || a.category} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 truncate">{a.category}</span>
                      <span className="text-slate-500 flex-shrink-0 ml-2">{a.score}%</span>
                    </div>
                    <ProgressBar value={a.score} max={100} color="accent" showLabel={false} height="h-1.5" />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-600">{a.accuracy}% acc</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-slate-500 text-sm">No aptitude data tracked</p>
              <Link to="/aptitude" className="text-primary-400 text-xs hover:underline mt-1">
                Start tracking →
              </Link>
            </div>
          )}
        </div>

        {/* Resume history */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium text-sm">Resume Analyses</h3>
            <Link to="/resume" className="text-primary-400 text-xs hover:text-primary-300 transition-colors">
              Analyze →
            </Link>
          </div>
          {resume.history?.length > 0 ? (
            <div className="space-y-3">
              {resume.history.map((r, i) => {
                const scoreColor =
                  r.score >= 75 ? 'text-green-400' :
                  r.score >= 50 ? 'text-yellow-400' : 'text-red-400';
                return (
                  <div key={r.id || i} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? 'bg-primary-600/10 border border-primary-500/20' : 'bg-slate-800/50'}`}>
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">📄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs truncate">{r.fileName || 'Resume'}</p>
                      <p className="text-slate-600 text-[10px]">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-lg font-bold ${scoreColor}`}>{r.score}</span>
                      <p className="text-slate-600 text-[10px]">/100</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">📄</span>
              <p className="text-slate-500 text-sm">No resume analyzed yet</p>
              <Link to="/resume" className="text-primary-400 text-xs hover:underline mt-1">
                Analyze your resume →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent applications ───────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-200 font-semibold">Recent Applications</h3>
          <Link to="/tracker" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
            View all →
          </Link>
        </div>
        {stats?.recentApplications?.length > 0 ? (
          <div className="space-y-0">
            {stats.recentApplications.map((app, i) => {
              const daysSince = Math.floor((Date.now() - new Date(app.createdAt)) / 86400000);
              const daysLabel = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`;
              return (
                <Link
                  key={app.id}
                  to="/tracker"
                  className={`flex items-center gap-4 py-3 ${i < stats.recentApplications.length - 1 ? 'border-b border-slate-800' : ''} hover:bg-slate-800/30 -mx-6 px-6 transition-colors`}
                >
                  {/* Company initial avatar */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600/30 to-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-400 font-bold text-sm">
                      {app.company.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium text-sm truncate">{app.company}</p>
                    <p className="text-slate-500 text-xs truncate">{app.role}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-slate-600 text-xs hidden sm:block">{daysLabel}</span>
                    <StatusBadge status={app.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-3xl mb-2">📋</span>
            <p className="text-slate-500 text-sm">No applications yet</p>
            <Link to="/tracker" className="text-primary-400 text-xs hover:underline mt-1">
              Add your first application →
            </Link>
          </div>
        )}
      </div>

      {/* ── Suggestions ───────────────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="card border-primary-800/30 bg-gradient-to-br from-primary-900/20 to-slate-900/40">
          <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
            <span>💡</span> Suggested Next Steps
          </h3>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const meta = SUGGESTION_META[s.type] || { emoji: '→', to: '/dashboard' };
              return (
                <Link
                  key={i}
                  to={meta.to}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all"
                >
                  <span className="text-base flex-shrink-0">{meta.emoji}</span>
                  <span className="text-slate-300 text-sm">{s.msg}</span>
                  <svg className="w-4 h-4 text-slate-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick action grid ──────────────────────────────────────────────── */}
      <div>
        <h3 className="text-slate-200 font-semibold mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${link.color}`}
            >
              <span className="text-2xl">{link.emoji}</span>
              <span className="text-slate-200 font-medium text-xs text-center leading-tight">{link.label}</span>
              <span className="text-slate-500 text-[10px] text-center leading-tight hidden sm:block">{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;