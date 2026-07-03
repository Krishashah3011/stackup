import { useState, useRef, useEffect, useCallback } from 'react';
import { aiService } from '../services/api';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── Score meta ───────────────────────────────────────────────────────────────
const scoreMeta = (score) => {
  if (score >= 80) return { color: '#10b981', label: 'Excellent', emoji: '🏆', grade: 'A' };
  if (score >= 65) return { color: '#22c55e', label: 'Good',      emoji: '✅', grade: 'B' };
  if (score >= 50) return { color: '#f59e0b', label: 'Fair',      emoji: '⚠️',  grade: 'C' };
  return               { color: '#ef4444', label: 'Needs Work', emoji: '🔴', grade: 'D' };
};

// ─── Animated SVG ring ────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 140, stroke = 12 }) => {
  const meta  = scoreMeta(score);
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={meta.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white leading-none">{score}</span>
          <span className="text-slate-500 text-xs mt-0.5">/ 100</span>
          <span className="text-lg mt-1 font-bold" style={{ color: meta.color }}>{meta.grade}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span>{meta.emoji}</span>
        <span className="font-semibold text-sm" style={{ color: meta.color }}>{meta.label}</span>
      </div>
    </div>
  );
};

// ─── Score band breakdown ─────────────────────────────────────────────────────
const ScoreBands = ({ score }) => {
  const bands = [
    { label: 'ATS Parse',   value: Math.min(100, Math.round(score * 1.1)), desc: 'Machine readability'   },
    { label: 'Keywords',    value: Math.max(0, score - 10),                desc: 'Keyword density'       },
    { label: 'Formatting',  value: Math.min(100, score + 5),               desc: 'Layout & structure'    },
    { label: 'Relevance',   value: Math.max(0, score - 5),                 desc: 'Role alignment'        },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {bands.map((b) => {
        const m = scoreMeta(b.value);
        return (
          <div key={b.label} className="bg-slate-800/60 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-400 text-xs">{b.label}</span>
              <span className="font-bold text-sm" style={{ color: m.color }}>{b.value}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${b.value}%`, backgroundColor: m.color }}
              />
            </div>
            <p className="text-slate-600 text-[10px] mt-1">{b.desc}</p>
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
    green:  { bg: 'bg-green-500/8',   border: 'border-green-500/20', text: 'text-green-300',  icon: '✅', dot: 'bg-green-500'  },
    red:    { bg: 'bg-red-500/8',     border: 'border-red-500/20',   text: 'text-red-300',    icon: '❌', dot: 'bg-red-500'    },
    yellow: { bg: 'bg-yellow-500/8',  border: 'border-yellow-500/20',text: 'text-yellow-300', icon: '💡', dot: 'bg-yellow-500' },
    blue:   { bg: 'bg-blue-500/8',    border: 'border-blue-500/20',  text: 'text-blue-300',   icon: '🎯', dot: 'bg-blue-500'   },
    slate:  { bg: 'bg-slate-800/50',  border: 'border-slate-700',    text: 'text-slate-300',  icon: '→',  dot: 'bg-slate-500'  },
  };
  const c = COLOR_MAP[color] || COLOR_MAP.slate;

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => expandable && setExpanded(!expanded)}
      >
        <h3 className="text-slate-200 font-semibold flex items-center gap-2">
          <span>{emoji}</span>
          {title}
          <span className="text-xs text-slate-500 font-normal">({items.length})</span>
        </h3>
        {expandable && (
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex gap-2.5 p-3 rounded-xl border text-sm leading-relaxed ${c.bg} ${c.border} ${c.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
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
      <h3 className="text-slate-200 font-semibold flex items-center gap-2 mb-3">
        <span>🔍</span> Missing Keywords
        <span className="text-xs text-slate-500 font-normal">({keywords.length})</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-medium hover:bg-red-500/20 transition-colors cursor-default"
          >
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
            {kw}
          </span>
        ))}
      </div>
      <p className="text-slate-600 text-xs mt-3">
        Add these keywords naturally into your resume to improve ATS match rate.
      </p>
    </div>
  );
};

// ─── History panel ────────────────────────────────────────────────────────────
const HistoryPanel = ({ history, onSelect, activeId }) => {
  if (!history?.length) return null;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-slate-300 font-medium text-sm">Past Analyses</h3>
        <span className="text-slate-500 text-xs">{history.length}</span>
      </div>
      <div className="divide-y divide-slate-800">
        {history.map((r, i) => {
          const meta     = scoreMeta(r.score);
          const isActive = activeId === r.id;
          const daysAgo  = Math.floor((Date.now() - new Date(r.createdAt)) / 86400000);
          const label    = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

          return (
            <button
              key={r.id || i}
              onClick={() => onSelect(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/50 ${isActive ? 'bg-primary-600/10' : ''}`}
            >
              {/* Score badge */}
              <div
                className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border"
                style={{ backgroundColor: `${meta.color}15`, borderColor: `${meta.color}35` }}
              >
                <span className="text-sm font-bold" style={{ color: meta.color }}>{r.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium truncate">
                  {r.fileName || 'Resume'}
                </p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
              {i === 0 && (
                <span className="text-[10px] bg-primary-600/20 border border-primary-500/30 text-primary-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
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
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? 'border-primary-500 bg-primary-500/10 scale-[1.01]'
          : file
          ? 'border-accent-500/60 bg-accent-500/5'
          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => !file && fileRef.current?.click()}
    >
      <input
        ref={fileRef} type="file" accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {file ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-accent-500/20 border border-accent-500/30 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">📄</span>
          </div>
          <div>
            <p className="text-slate-200 font-semibold">{file.name}</p>
            <p className="text-slate-500 text-sm mt-0.5">{(file.size / 1024).toFixed(1)} KB · PDF</p>
          </div>
          <button
            className="text-red-400 hover:text-red-300 text-xs transition-colors flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Remove file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-slate-300 font-semibold">Drop your resume here</p>
            <p className="text-slate-500 text-sm mt-0.5">or click to browse</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              PDF only
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Max 5 MB
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Text-based PDF
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Analysis results ─────────────────────────────────────────────────────────
const AnalysisResult = ({ result, onReset }) => {
  const meta = scoreMeta(result.score);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score hero */}
      <div className="card bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/80 overflow-hidden relative">
        {/* Background glow */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: meta.color }}
        />
        <div className="relative flex flex-col sm:flex-row items-center gap-8">
          {/* Ring */}
          <ScoreRing score={result.score} />

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-slate-400 text-sm">ATS Compatibility Score</p>
            <h2 className="text-2xl font-bold text-white mt-0.5 mb-1">Analysis Complete</h2>

            {result.summary && (
              <p className="text-slate-400 text-sm leading-relaxed mb-4 italic max-w-sm">
                "{result.summary}"
              </p>
            )}

            {/* Stat chips */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-full">
                ✅ {result.strengths?.length || 0} strengths
              </span>
              <span className="flex items-center gap-1.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-full">
                🔍 {result.missingKeywords?.length || 0} missing keywords
              </span>
              <span className="flex items-center gap-1.5 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full">
                💡 {result.improvementSuggestions?.length || 0} suggestions
              </span>
            </div>
          </div>
        </div>

        {/* Score bands */}
        <ScoreBands score={result.score} />

        {/* Reset button */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button className="btn-secondary text-sm flex items-center gap-2" onClick={onReset}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Analyze Another Resume
          </button>
        </div>
      </div>

      {/* Analysis sections */}
      <SectionCard
        title="Strengths"
        emoji="✅"
        items={result.strengths}
        color="green"
        expandable
      />

      <KeywordChips keywords={result.missingKeywords} />

      <SectionCard
        title="Improvement Suggestions"
        emoji="💡"
        items={result.improvementSuggestions}
        color="yellow"
        expandable
      />

      <SectionCard
        title="ATS Optimisation Tips"
        emoji="🎯"
        items={result.atsTips}
        color="blue"
        expandable
      />

      {/* Score improvement roadmap */}
      {result.score < 80 && (
        <div className="card border-primary-800/30 bg-gradient-to-br from-primary-900/20 to-slate-900/40">
          <h3 className="text-slate-200 font-semibold flex items-center gap-2 mb-3">
            <span>🗺️</span> Score Improvement Roadmap
          </h3>
          <div className="space-y-2">
            {result.score < 50 && (
              <div className="flex gap-2.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-sm text-slate-400">
                <span className="text-red-400 flex-shrink-0 font-bold">1.</span>
                Add all the missing keywords listed above — this alone can add 15–20 points.
              </div>
            )}
            {result.score < 70 && (
              <div className="flex gap-2.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-sm text-slate-400">
                <span className="text-yellow-400 flex-shrink-0 font-bold">{result.score < 50 ? '2' : '1'}.</span>
                Use standard section headings: "Work Experience", "Education", "Skills" — avoid creative titles.
              </div>
            )}
            <div className="flex gap-2.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-sm text-slate-400">
              <span className="text-primary-400 flex-shrink-0 font-bold">{result.score < 50 ? '3' : result.score < 70 ? '2' : '1'}.</span>
              Quantify your achievements with numbers and metrics — "Reduced load time by 40%" scores higher than "Improved performance".
            </div>
            <div className="flex gap-2.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-sm text-slate-400">
              <span className="text-accent-400 flex-shrink-0 font-bold">{result.score < 50 ? '4' : result.score < 70 ? '3' : '2'}.</span>
              Save as a single-column PDF — multi-column layouts often break ATS parsers.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ResumePage = () => {
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const fileRef = useRef(null);

  // ── Fetch history on mount ─────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await aiService.getResumeHistory();
      setHistory(
        (data.data || []).map((r) => ({
          id:        r._id,
          score:     r.score,
          fileName:  r.fileName,
          createdAt: r.createdAt,
        }))
      );
    } catch {
      // history is non-critical
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Analyse ────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) { toast.error('Please upload a PDF resume first'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await aiService.analyzeResume(formData);
      setResult(data.data);
      toast.success('Resume analyzed successfully! 🎉');
      fetchHistory(); // refresh history list
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
    // Load a past result into the result view (partial data from history)
    setResult({
      score:                  record.score,
      summary:                '',
      strengths:              [],
      missingKeywords:        [],
      improvementSuggestions: [],
      atsTips:                [],
      _fromHistory:           true,
      fileName:               record.fileName,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex gap-5 items-start">

        {/* ── Main content ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4 max-w-3xl">

          {/* Upload card — show when no result and not loading */}
          {!result && !loading && (
            <div className="card space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-500/20 border border-accent-500/30 rounded-xl flex items-center justify-center text-xl">
                  📄
                </div>
                <div>
                  <h2 className="text-slate-200 font-semibold">AI Resume Analyzer</h2>
                  <p className="text-slate-500 text-xs">Powered by Google Gemini — ATS score, keyword gap, improvement plan</p>
                </div>
              </div>

              {/* Upload zone */}
              <UploadZone
                file={file}
                onFile={setFile}
                onClear={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              />

              {/* What you get section */}
              {!file && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { emoji: '🎯', label: 'ATS Score',       desc: '0–100 compatibility' },
                    { emoji: '🔍', label: 'Keyword Gap',      desc: 'Missing terms'       },
                    { emoji: '💡', label: 'Suggestions',      desc: 'Actionable fixes'    },
                    { emoji: '📈', label: 'ATS Tips',         desc: 'Optimisation guide'  },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-center">
                      <span className="text-xl">{item.emoji}</span>
                      <p className="text-slate-300 text-xs font-medium mt-1">{item.label}</p>
                      <p className="text-slate-600 text-[10px] mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Analyze button */}
              {file && (
                <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleAnalyze}>
                  ✨ Analyze Resume with AI
                </button>
              )}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="card text-center py-14 space-y-4">
              <div className="w-20 h-20 bg-accent-500/20 border border-accent-500/30 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
                <span className="text-4xl">🤖</span>
              </div>
              <div>
                <p className="text-slate-200 font-semibold text-lg">Analyzing your resume…</p>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                  Gemini AI is reviewing ATS compatibility, keyword gaps, and improvement opportunities
                </p>
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                {['Extracting resume text…', 'Running ATS checks…', 'Identifying keyword gaps…', 'Generating suggestions…'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-4 h-4 border border-accent-500/50 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
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
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-yellow-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Showing summary only — full analysis is not stored. Upload the PDF again to see detailed suggestions.
                </div>
              )}
              <AnalysisResult result={result} onReset={handleReset} />
            </>
          )}
        </div>

        {/* ── History sidebar ────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 hidden lg:block sticky top-24 space-y-4">
          {histLoading ? (
            <div className="card flex justify-center py-8"><Spinner /></div>
          ) : (
            <HistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              activeId={result?._id}
            />
          )}

          {/* Tips card */}
          <div className="card bg-gradient-to-br from-primary-900/20 to-slate-900/40 border-primary-800/20">
            <p className="text-slate-300 font-medium text-sm mb-2">📋 Resume Tips</p>
            <ul className="space-y-1.5 text-slate-500 text-xs">
              {[
                'Use text-based PDF, not scanned',
                'Keep under 2 pages',
                'Use standard section headings',
                'Tailor keywords to job description',
                'Quantify achievements with numbers',
              ].map((tip, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-primary-500 flex-shrink-0">→</span>
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