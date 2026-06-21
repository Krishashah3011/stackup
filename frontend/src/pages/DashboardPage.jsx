import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import StatCard from '../components/common/StatCard';
import ProgressBar from '../components/common/ProgressBar';
import StatusBadge from '../components/common/StatusBadge';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const BriefcaseIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const CheckIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const DocumentIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DSA_TOPIC_COLORS = {
  Arrays: 'primary', Strings: 'accent', 'Linked List': 'purple',
  'Stack & Queue': 'yellow', Hashing: 'green', Trees: 'accent',
  Graphs: 'red', 'Dynamic Programming': 'purple',
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardService.getStats();
        setStats(data.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-primary-900/40 to-slate-900/60 border border-primary-800/30 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Here's your placement preparation overview for today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={stats?.applications?.total ?? 0}
          icon={BriefcaseIcon}
          color="primary"
          subtitle="All time"
        />
        <StatCard
          title="Selected"
          value={stats?.applications?.selected ?? 0}
          icon={CheckIcon}
          color="green"
          subtitle="Offers received"
        />
        <StatCard
          title="Rejected"
          value={stats?.applications?.rejected ?? 0}
          icon={XIcon}
          color="red"
          subtitle="Keep applying!"
        />
        <StatCard
          title="Interviews"
          value={stats?.applications?.interviewScheduled ?? 0}
          icon={CalendarIcon}
          color="yellow"
          subtitle="Scheduled"
        />
      </div>

      {/* Progress section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resume Score */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DocumentIcon className="w-4 h-4 text-accent-400" />
            <h3 className="text-slate-300 font-medium text-sm">Resume Score</h3>
          </div>
          {stats?.resumeScore !== null && stats?.resumeScore !== undefined ? (
            <div className="flex flex-col items-center py-2">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={stats.resumeScore >= 70 ? '#10b981' : stats.resumeScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={`${stats.resumeScore * 2.51} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{stats.resumeScore}</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-2">
                {stats.resumeScore >= 70 ? '🟢 Strong' : stats.resumeScore >= 50 ? '🟡 Needs work' : '🔴 Needs improvement'}
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No resume analyzed yet</p>
              <a href="/resume" className="text-primary-400 text-xs hover:underline mt-1 block">Analyze your resume →</a>
            </div>
          )}
        </div>

        {/* DSA Progress */}
        <div className="card">
          <h3 className="text-slate-300 font-medium text-sm mb-4">DSA Progress</h3>
          {stats?.dsaBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.dsaBreakdown.slice(0, 5).map((d) => (
                <div key={d._id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{d.topic}</span>
                    <span className="text-slate-500">{d.solvedProblems}/{d.totalProblems}</span>
                  </div>
                  <ProgressBar value={d.progress} max={100} color={DSA_TOPIC_COLORS[d.topic] || 'primary'} showLabel={false} />
                </div>
              ))}
              <p className="text-slate-500 text-xs pt-1">
                Overall: <span className="text-primary-400 font-medium">{stats.dsaProgress}%</span>
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No DSA progress tracked</p>
              <a href="/dsa" className="text-primary-400 text-xs hover:underline mt-1 block">Start tracking →</a>
            </div>
          )}
        </div>

        {/* Aptitude Progress */}
        <div className="card">
          <h3 className="text-slate-300 font-medium text-sm mb-4">Aptitude Progress</h3>
          {stats?.aptitudeBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.aptitudeBreakdown.map((a) => (
                <div key={a._id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 truncate pr-2">{a.category}</span>
                    <span className="text-slate-500 flex-shrink-0">{a.score}%</span>
                  </div>
                  <ProgressBar value={a.score} max={100} color="accent" showLabel={false} />
                </div>
              ))}
              <p className="text-slate-500 text-xs pt-1">
                Avg score: <span className="text-accent-400 font-medium">{stats.aptitudeProgress}%</span>
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No aptitude data yet</p>
              <a href="/aptitude" className="text-primary-400 text-xs hover:underline mt-1 block">Start tracking →</a>
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-200 font-semibold">Recent Applications</h3>
          <a href="/tracker" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
            View all →
          </a>
        </div>

        {stats?.recentApplications?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                <div>
                  <p className="text-slate-200 font-medium text-sm">{app.company}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{app.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 text-xs hidden sm:block">
                    {new Date(app.appliedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No applications yet.</p>
            <a href="/tracker" className="text-primary-400 text-xs hover:underline mt-1 block">Add your first application →</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
