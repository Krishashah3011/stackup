import { useState, useRef, useEffect, useCallback } from 'react';
import { aiService } from '../services/api';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── Score meta ───────────────────────────────────────────────────────────────
const scoreMeta = (score) => {
  if (score >= 80) return { color: '#10B981', label: 'Excellent',      emoji: '🏆', grade: 'A' };
  if (score >= 65) return { color: '#22C55E', label: 'Good',           emoji: '✅', grade: 'B' };
  if (score >= 50) return { color: '#F59E0B', label: 'Fair',           emoji: '⚠️',  grade: 'C' };
  return               { color: '#EF4444', label: 'Needs Work',      emoji: '🔴', grade: 'D' };
};

// ─── Animated SVG Ring ────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 140, stroke = 12 }) => {
  const meta = scoreMeta(score);
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={meta.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease-out' }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black leading-none" style={{ color: 'var(--text)' }}>{score}</span>
          <span className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>/100</span>
          <span className="text-lg font-black mt-0.5" style={{ color: meta.color }}>{meta.grade}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span>{meta.emoji}</span>
        <span className="font-bold text-sm" style={{ color: meta.color }}>{meta.label}</span>
      </div>
    </div>
  );
};

// ─── Score bands breakdown ────────────────────────────────────────────────────
const ScoreBands = ({ score }) => {
  const bands = [
    { label: 'ATS Parse',   value: Math.min(100, Math.round(score * 1.1)), desc: 'Machine readability'  },
    { label: 'Keywords',    value: Math.max(0,   score - 10),              desc: 'Keyword density'      },
    { label: 'Formatting',  value: Math.min(100, score + 5),               desc: 'Layout & structure'   },
    { label: 'Relevance',   value: Math.max(0,   score - 5),               desc: 'Role alignment'       },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {bands.map((b) => {
        const m = scoreMeta(b.value);
        return (
          <div key={b.label} className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{b.label}</span>
              <span className="font-black text-sm" style={{ color: m.color }}>{b.value}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.value}%`, background: m.color }}/>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{b.desc}</p>
          </div>
        );
      })}
    </div>
  );
};

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, emoji, items, color, expandable = false }) => {
  const [expanded, setExpanded] = useState(true);
  if (!items?.length) return null;

  const COLOR_MAP = {
    green:  { bg: 'color-mix(in srgb,#10B981 8%,transparent)', border: 'color-mix(in srgb,#10B981 20%,transparent)', text: '#059669', dot: '#10B981' },
    yellow: { bg: 'color-mix(in srgb,#F59E0B 8%,transparent)', border: 'color-mix(in srgb,#F59E0B 20%,transparent)', text: '#D97706', dot: '#F59E0B' },
    blue:   { bg: 'color-mix(in srgb,#3B82F6 8%,transparent)', border: 'color-mix(in srgb,#3B82F6 20%,transparent)', text: '#2563EB', dot: '#3B82F6' },
    red:    { bg: 'color-mix(in srgb,#EF4444 8%,transparent)', border: 'color-mix(in srgb,#EF4444 20%,transparent)', text: '#DC2626', dot: '#EF4444' },
  };
  const c = COLOR_MAP[color] || { bg: 'var(--surface-2)', border: 'var(--border)', text: 'var(--text-2)', dot: 'var(--primary)' };

  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => expandable && setExpanded(!expanded)}
      >
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <span>{emoji}</span>
          {title}
          <span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>({items.length})</span>
        </h3>
        {expandable && (
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2.5 p-3 rounded-xl border text-sm leading-relaxed"
              style={{ background: c.bg, borderColor: c.border, color: c.text }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: c.dot }}/>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Keyword chips ────────────────────────────────────────────────────────────
const KeywordChips = ({ keywords }) => {
  if (!keywords?.length) return null;
  return (
    <div className="card">
      <h3 className="font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--text)' }}>
        <span>🔍</span> Missing Keywords
        <span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>({keywords.length})</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: 'color-mix(in srgb,#EF4444 10%,transparent)',
              border: '1px solid color-mix(in srgb,#EF4444 25%,transparent)',
              color: '#DC2626',
            }}>
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#EF4444' }}/>
            {kw}
          </span>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Add these keywords naturally to improve your ATS match rate.
      </p>
    </div>
  );
};

// ─── History panel ────────────────────────────────────────────────────────────
const HistoryPanel = ({ history, onSelect, activeId }) => {
  if (!history?.length) return null;
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>Past Analyses</h3>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{history.length}</span>
      </div>
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        {history.map((r, i) => {
          const meta    = scoreMeta(r.score);
          const isActive = activeId === r.id;
          const daysAgo = Math.floor((Date.now() - new Date(r.createdAt)) / 86400000);
          const label   = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
          return (
            <button key={r.id || i} onClick={() => onSelect(r)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
              style={{
                background: isActive ? 'color-mix(in srgb,var(--primary) 6%,transparent)' : 'transparent',
                borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border"
                style={{ background: `color-mix(in srgb,${meta.color} 12%,transparent)`, borderColor: `color-mix(in srgb,${meta.color} 30%,transparent)` }}>
                <span className="text-sm font-black" style={{ color: meta.color }}>{r.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{r.fileName || 'Resume'}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
              </div>
              {i === 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                  style={{ background: 'color-mix(in srgb,var(--primary) 12%,transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb,var(--primary) 25%,transparent)' }}>
                  Latest
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Upload zone ──────────────────────────────────────────────────────────────
const UploadZone = ({ file, onFile, onClear }) => {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (f.size > 5 * 1024 * 1024)    { toast.error('File must be under 5 MB');     return; }
    onFile(f);
  };

  return (
    <div
      className="rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 border-2"
      style={{
        borderStyle: 'dashed',
        borderColor: dragging ? 'var(--primary)' : file ? 'var(--success)' : 'var(--border)',
        background:  dragging ? 'color-mix(in srgb,var(--primary) 5%,transparent)'
                   : file    ? 'color-mix(in srgb,var(--success) 4%,transparent)'
                   : 'var(--surface-2)',
        transform: dragging ? 'scale(1.01)' : 'scale(1)',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => !file && fileRef.current?.click()}
    >
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
        onChange={e => handleFile(e.target.files[0])}/>

      {file ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'color-mix(in srgb,var(--success) 12%,transparent)', border: '1px solid color-mix(in srgb,var(--success) 25%,transparent)' }}>
            📄
          </div>
          <div>
            <p className="font-bold" style={{ color: 'var(--text)' }}>{file.name}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{(file.size / 1024).toFixed(1)} KB · PDF</p>
          </div>
          <button className="text-xs font-semibold flex items-center gap-1 transition-colors"
            style={{ color: 'var(--danger)' }}
            onClick={e => { e.stopPropagation(); onClear(); }}>
            ✕ Remove file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <div>
            <p className="font-bold" style={{ color: 'var(--text)' }}>Drop your resume here</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>or click to browse</p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {['PDF only', 'Max 5 MB', 'Text-based PDF'].map(t => (
              <span key={t} className="flex items-center gap-1">
                <svg className="w-3 h-3" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Analysis Results ─────────────────────────────────────────────────────────
const AnalysisResult = ({ result, onReset }) => {
  const meta = scoreMeta(result.score);
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score hero */}
      <div className="card relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-15 pointer-events-none"
          style={{ background: meta.color }}/>
        <div className="relative flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={result.score}/>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>ATS Compatibility Score</p>
            <h2 className="text-2xl font-black mt-0.5 mb-1" style={{ color: 'var(--text)' }}>Analysis Complete</h2>
            {result.summary && (
              <p className="text-sm italic leading-relaxed mb-4 max-w-sm" style={{ color: 'var(--text-3)' }}>
                "{result.summary}"
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {[
                { label: `${result.strengths?.length || 0} strengths`,         color: '#10B981', bg: 'color-mix(in srgb,#10B981 10%,transparent)', border: 'color-mix(in srgb,#10B981 25%,transparent)' },
                { label: `${result.missingKeywords?.length || 0} missing kws`, color: '#EF4444', bg: 'color-mix(in srgb,#EF4444 10%,transparent)', border: 'color-mix(in srgb,#EF4444 25%,transparent)' },
                { label: `${result.improvementSuggestions?.length || 0} tips`, color: '#F59E0B', bg: 'color-mix(in srgb,#F59E0B 10%,transparent)', border: 'color-mix(in srgb,#F59E0B 25%,transparent)' },
              ].map(({ label, color, bg, border }) => (
                <span key={label} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: bg, border: `1px solid ${border}`, color }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <ScoreBands score={result.score}/>
        <div className="mt-5 pt-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-secondary btn-sm flex items-center gap-2" onClick={onReset}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Analyze Another Resume
          </button>
        </div>
      </div>

      <SectionCard title="Strengths"                emoji="✅" items={result.strengths}              color="green"  expandable/>
      <KeywordChips keywords={result.missingKeywords}/>
      <SectionCard title="Improvement Suggestions"  emoji="💡" items={result.improvementSuggestions} color="yellow" expandable/>
      <SectionCard title="ATS Optimisation Tips"    emoji="🎯" items={result.atsTips}                color="blue"   expandable/>

      {/* Roadmap */}
      {result.score < 80 && (
        <div className="card" style={{ background: 'color-mix(in srgb,var(--primary) 4%,var(--surface))', border: '1px solid color-mix(in srgb,var(--primary) 20%,transparent)' }}>
          <h3 className="font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--text)' }}>
            🗺️ Score Improvement Roadmap
          </h3>
          <div className="space-y-2">
            {[
              ...(result.score < 50 ? [{ n: 1, color: 'var(--danger)',   text: 'Add all the missing keywords above — this alone can add 15–20 points.' }] : []),
              ...(result.score < 70 ? [{ n: result.score < 50 ? 2 : 1, color: 'var(--warning)', text: 'Use standard section headings: "Work Experience", "Education", "Skills".' }] : []),
              { n: result.score < 50 ? 3 : result.score < 70 ? 2 : 1, color: 'var(--primary)', text: 'Quantify achievements with numbers — "Reduced load time by 40%" scores higher than vague statements.' },
              { n: result.score < 50 ? 4 : result.score < 70 ? 3 : 2, color: 'var(--success)', text: 'Save as a single-column PDF — multi-column layouts often break ATS parsers.' },
            ].map(({ n, color, text }) => (
              <div key={n} className="flex gap-2.5 p-3 rounded-xl border text-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                <span className="font-black flex-shrink-0" style={{ color }}>{n}.</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ResumePage = () => {
  const [file,        setFile]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const fileRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await aiService.getResumeHistory();
      setHistory((data.data || []).map(r => ({ id: r._id, score: r.score, fileName: r.fileName, createdAt: r.createdAt })));
    } catch {
      // non-critical
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleAnalyze = async () => {
    if (!file) { toast.error('Please upload a PDF resume first'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await aiService.analyzeResume(formData);
      setResult(data.data);
      toast.success('Resume analyzed successfully! 🎉');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleHistorySelect = (record) => {
    setResult({
      score: record.score, summary: '',
      strengths: [], missingKeywords: [],
      improvementSuggestions: [], atsTips: [],
      _fromHistory: true, fileName: record.fileName,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex gap-5 items-start">

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4 max-w-3xl">

          {/* Upload card */}
          {!result && !loading && (
            <div className="card space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'color-mix(in srgb,var(--success) 12%,transparent)', border: '1px solid color-mix(in srgb,var(--success) 25%,transparent)' }}>
                  📄
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: 'var(--text)' }}>AI Resume Analyzer</h2>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>Powered by Google Gemini — ATS score, keyword gap, improvement plan</p>
                </div>
              </div>

              <UploadZone
                file={file}
                onFile={setFile}
                onClear={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              />

              {/* Feature preview */}
              {!file && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { emoji: '🎯', label: 'ATS Score',    desc: '0–100 rating'       },
                    { emoji: '🔍', label: 'Keyword Gap',  desc: 'Missing terms'       },
                    { emoji: '💡', label: 'Suggestions',  desc: 'Actionable fixes'    },
                    { emoji: '📈', label: 'ATS Tips',     desc: 'Optimisation guide'  },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-3 text-center"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <span className="text-xl">{item.emoji}</span>
                      <p className="font-semibold text-xs mt-1" style={{ color: 'var(--text)' }}>{item.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {file && (
                <button className="btn-primary w-full" onClick={handleAnalyze}>
                  ✨ Analyze Resume with AI
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card text-center py-14 space-y-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-4xl animate-bounce-soft"
                style={{ background: 'color-mix(in srgb,var(--success) 12%,transparent)', border: '1px solid color-mix(in srgb,var(--success) 25%,transparent)' }}>
                🤖
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>Analyzing your resume…</p>
                <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-3)' }}>
                  Gemini AI is reviewing ATS compatibility, keyword gaps, and improvement opportunities
                </p>
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                {['Extracting resume text…', 'Running ATS checks…', 'Identifying keyword gaps…', 'Generating suggestions…'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
                      style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', animationDelay: `${i * 0.2}s` }}/>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              {result._fromHistory && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'color-mix(in srgb,var(--warning) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--warning) 25%,transparent)', color: 'var(--warning)' }}>
                  ℹ️ Showing summary only. Upload the PDF again to see full detailed analysis.
                </div>
              )}
              <AnalysisResult result={result} onReset={handleReset}/>
            </>
          )}
        </div>

        {/* History sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block sticky top-24 space-y-4">
          {histLoading
            ? <div className="card flex justify-center py-8"><Spinner/></div>
            : <HistoryPanel history={history} onSelect={handleHistorySelect} activeId={result?._id}/>
          }

          {/* Static tips */}
          <div className="card" style={{ background: 'color-mix(in srgb,var(--primary) 4%,var(--surface))', border: '1px solid color-mix(in srgb,var(--primary) 20%,transparent)' }}>
            <p className="font-semibold text-sm mb-2.5" style={{ color: 'var(--text)' }}>📋 Resume Tips</p>
            <ul className="space-y-2">
              {[
                'Use text-based PDF, not scanned',
                'Keep under 2 pages',
                'Use standard section headings',
                'Tailor keywords to job description',
                'Quantify achievements with numbers',
              ].map((tip, i) => (
                <li key={i} className="flex gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                  <span style={{ color: 'var(--primary)' }}>→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePage;
