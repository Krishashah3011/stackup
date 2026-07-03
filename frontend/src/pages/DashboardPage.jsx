import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const Ring = ({ value=0, color, size=96, stroke=10 }) => {
  const r = (size-stroke)/2, circ = 2*Math.PI*r, dash = (value/100)*circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray 1s ease-out'}}/>
    </svg>
  );
};

const WeeklyBar = ({ data=[] }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d=>d.count),1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((w,i) => {
        const pct = (w.count/max)*100, isLast = i===data.length-1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 rounded-lg px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' }}>
              {w.label}: {w.count}
            </div>
            <div className="w-full rounded-t-md transition-all duration-700"
              style={{ height: `${Math.max(pct,4)}%`, background: isLast ? 'var(--primary)' : 'var(--border)' }}/>
          </div>
        );
      })}
    </div>
  );
};

const QUICK_LINKS = [
  { to:'/tracker',   label:'Placement Tracker', emoji:'📋', desc:'Track job applications'     },
  { to:'/dsa',       label:'DSA Tracker',        emoji:'💻', desc:'Topic-wise problems'        },
  { to:'/aptitude',  label:'Aptitude',           emoji:'📊', desc:'Score & accuracy'           },
  { to:'/interview', label:'AI Interview',       emoji:'🤖', desc:'Tailored questions'         },
  { to:'/resume',    label:'Resume Analyzer',    emoji:'📄', desc:'ATS score & suggestions'    },
];
const SUGGESTION_META = { tracker:{emoji:'📋',to:'/tracker'}, dsa:{emoji:'💻',to:'/dsa'}, aptitude:{emoji:'📊',to:'/aptitude'}, resume:{emoji:'📄',to:'/resume'} };
const readinessMeta = s => s>=80?{label:'Placement Ready',color:'var(--success)',emoji:'🏆'}:s>=60?{label:'Almost There',color:'var(--warning)',emoji:'🔥'}:s>=40?{label:'In Progress',color:'var(--primary)',emoji:'📈'}:{label:'Just Starting',color:'var(--text-3)',emoji:'🚀'};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(() => { mounted.current=true; return ()=>{mounted.current=false;}; }, []);

  useEffect(() => {
    (async()=>{
      try { const {data}=await dashboardService.getStats(); if(mounted.current) setStats(data.data); }
      catch { if(mounted.current) toast.error('Failed to load dashboard'); }
      finally { if(mounted.current) setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size="lg"/></div>;

  const greeting = ()=>{const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening';};
  const apps=stats?.applications||{}, dsa=stats?.dsa||{}, apt=stats?.aptitude||{}, resume=stats?.resume||{};
  const readiness=stats?.readinessScore??0, rMeta=readinessMeta(readiness);
  const suggestions=stats?.suggestions||[];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--surface)) 0%, var(--surface) 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ background: 'var(--primary)' }}/>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>{greeting()}</p>
            <h2 className="text-2xl font-black mt-0.5" style={{ color: 'var(--text)' }}>{user?.name?.split(' ')[0]} 👋</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Here's your placement preparation overview.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 flex-shrink-0"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span className="text-2xl">{rMeta.emoji}</span>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{rMeta.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Readiness: {readiness}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Readiness rings */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold" style={{ color: 'var(--text)' }}>Placement Readiness</h3>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Weighted across all modules</span>
        </div>
        <div className="flex flex-wrap gap-6 justify-around">
          {[
            { v:readiness,   color:'var(--primary)', label:'Overall',  sub:'Readiness Score' },
            { v:dsa.overall||0, color:'#8B5CF6',     label:'DSA',      sub:`${dsa.totalSolved||0}/${dsa.totalProblems||0} solved` },
            { v:apt.overall||0, color:'var(--success)', label:'Aptitude', sub:`${apt.avgAccuracy||0}% accuracy` },
            { v:resume.score??0, color:'var(--warning)', label:'Resume',  sub: resume.score!==null?'ATS Score':'Not analyzed' },
          ].map(({v,color,label,sub}) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="relative">
                <Ring value={v} color={color} size={88} stroke={9}/>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black" style={{ color: 'var(--text)' }}>{v}</span>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{label}</p>
              <p className="text-[10px] text-center" style={{ color: 'var(--text-3)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Application stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold" style={{ color: 'var(--text)' }}>Applications</h3>
          <Link to="/tracker" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary)' }}>View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label:'Total',      value:apps.total||0,                                   color:'var(--text)' },
            { label:'Selected',   value:apps['Selected']||0,                             color:'var(--success)' },
            { label:'Rejected',   value:apps['Rejected']||0,                             color:'var(--danger)' },
            { label:'Interviews', value:apps['Interview Scheduled']||0,                  color:'var(--warning)' },
            { label:'OA Stage',   value:(apps['OA Scheduled']||0)+(apps['OA Cleared']||0), color:'#8B5CF6' },
            { label:'Win Rate',   value:apps.conversionRate!=null?`${apps.conversionRate}%`:'—', color:'var(--success)' },
          ].map(({label,value,color}) => (
            <div key={label} className="card py-4 text-center">
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>Applications This Season</h3>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>Last 8 weeks</span>
          </div>
          {apps.total>0 ? <WeeklyBar data={apps.weeklyTrend||[]}/> : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No applications yet</p>
              <Link to="/tracker" className="text-xs font-medium hover:underline mt-1 block" style={{ color: 'var(--primary)' }}>Start applying →</Link>
            </div>
          )}
        </div>
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>DSA Progress by Topic</h3>
            <Link to="/dsa" className="text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>Manage →</Link>
          </div>
          {dsa.breakdown?.length>0 ? (
            <div className="space-y-3">
              {dsa.breakdown.map(d => (
                <div key={d.topic}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-2)' }}>{d.topic}</span>
                    <span style={{ color: 'var(--text-3)' }}>{d.solvedProblems}/{d.totalProblems}</span>
                  </div>
                  <ProgressBar value={d.progress} max={100} color={d.progress>=75?'accent':d.progress>=50?'primary':'yellow'} showLabel={false} height="h-1.5"/>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No DSA topics tracked</p>
              <Link to="/dsa" className="text-xs font-medium hover:underline mt-1 block" style={{ color: 'var(--primary)' }}>Add your first topic →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent applications */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ color: 'var(--text)' }}>Recent Applications</h3>
          <Link to="/tracker" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary)' }}>View all →</Link>
        </div>
        {stats?.recentApplications?.length>0 ? (
          <div>
            {stats.recentApplications.map((app,i) => {
              const d = Math.floor((Date.now()-new Date(app.createdAt))/86400000);
              const dl = d===0?'Today':d===1?'Yesterday':`${d}d ago`;
              return (
                <Link key={app.id} to="/tracker"
                  className="flex items-center gap-3 py-3 -mx-6 px-6 transition-colors"
                  style={{ borderBottom: i<stats.recentApplications.length-1?`1px solid var(--border)`:'none' }}
                  onMouseEnter={e=>e.currentTarget.style.background='color-mix(in srgb, var(--primary) 4%, transparent)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                    {app.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{app.company}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{app.role}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{dl}</span>
                    <StatusBadge status={app.status}/>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No applications yet</p>
            <Link to="/tracker" className="text-xs font-medium hover:underline mt-1 block" style={{ color: 'var(--primary)' }}>Add your first application →</Link>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length>0 && (
        <div className="card" style={{ background: 'color-mix(in srgb, var(--primary) 4%, var(--surface))' }}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>💡 Suggested Next Steps</h3>
          <div className="space-y-2">
            {suggestions.map((s,i) => {
              const meta = SUGGESTION_META[s.type]||{emoji:'→',to:'/dashboard'};
              return (
                <Link key={i} to={meta.to}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='var(--shadow-sm)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}}
                >
                  <span className="text-base">{meta.emoji}</span>
                  <span className="text-sm flex-1" style={{ color: 'var(--text-2)' }}>{s.msg}</span>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text)' }}>Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map(link => (
            <Link key={link.to} to={link.to}
              className="card flex flex-col items-center gap-2 py-5 text-center transition-all hover:-translate-y-0.5"
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='var(--shadow-sm)';}}
            >
              <span className="text-2xl">{link.emoji}</span>
              <span className="font-semibold text-xs" style={{ color: 'var(--text)' }}>{link.label}</span>
              <span className="text-[10px] hidden sm:block" style={{ color: 'var(--text-3)' }}>{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
