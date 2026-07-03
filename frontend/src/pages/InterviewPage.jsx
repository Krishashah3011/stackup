import { useState, useEffect, useCallback } from 'react';
import { aiService } from '../services/api';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'hrQuestions',           label: 'HR',            emoji: '🤝', desc: 'Behavioral & culture fit'      },
  { key: 'technicalQuestions',    label: 'Technical',     emoji: '💻', desc: 'Role & skills-based'           },
  { key: 'projectQuestions',      label: 'Projects',      emoji: '🚀', desc: 'Practical experience'          },
  { key: 'systemDesignQuestions', label: 'System Design', emoji: '🏗️',  desc: 'Architecture & scalability'   },
];

const DIFFICULTIES = ['Mixed', 'Easy', 'Medium', 'Hard'];

const DIFF_COLORS = {
  Easy:   'bg-green-500/10 text-green-400 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Hard:   'bg-red-500/10 text-red-400 border-red-500/20',
  Mixed:  'bg-primary-500/10 text-primary-400 border-primary-500/20',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg className="w-3.5 h-3.5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Extract difficulty tag from a question string like "[Hard] Explain..."  ──
const parseDifficulty = (q) => {
  const m = q.match(/^\[(Easy|Medium|Hard)\]/i);
  return m ? { tag: m[1], text: q.replace(/^\[(?:Easy|Medium|Hard)\]\s*/i, '') } : { tag: null, text: q };
};

// ─── Question Card ────────────────────────────────────────────────────────────
const QuestionCard = ({ question, index, bookmarked, onBookmark, showDifficulty = false }) => {
  const [copied, setCopied] = useState(false);
  const { tag, text } = showDifficulty ? parseDifficulty(question) : { tag: null, text: question };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/40 hover:border-slate-600/60 transition-all group">
      {/* Index badge */}
      <span className="flex-shrink-0 w-7 h-7 bg-slate-700 text-slate-400 rounded-lg flex items-center justify-center text-xs font-semibold mt-0.5">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        {/* Difficulty tag */}
        {tag && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border mb-1.5 ${DIFF_COLORS[tag] || DIFF_COLORS.Medium}`}>
            {tag}
          </span>
        )}
        <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handleCopy}
          title="Copy question"
          className={`p-1.5 rounded-lg transition-colors ${copied ? 'text-green-400 bg-green-500/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-700'}`}
        >
          {copied
            ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <CopyIcon />}
        </button>
        <button
          onClick={() => onBookmark(index)}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
        >
          <StarIcon filled={bookmarked} />
        </button>
      </div>
    </div>
  );
};

// ─── History sidebar item ─────────────────────────────────────────────────────
const HistoryItem = ({ session, isActive, onClick, onDelete }) => {
  const daysAgo = Math.floor((Date.now() - new Date(session.createdAt)) / 86400000);
  const label   = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all group ${
        isActive ? 'bg-primary-600/20 border border-primary-500/30' : 'hover:bg-slate-800 border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 font-medium text-sm truncate">{session.company}</p>
        <p className="text-slate-500 text-xs truncate">{session.role}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <ClockIcon />
          <span className="text-slate-600 text-[10px]">{label}</span>
          {session.difficulty && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${DIFF_COLORS[session.difficulty]}`}>
              {session.difficulty}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(session._id); }}
        className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 flex-shrink-0 mt-0.5"
        title="Delete session"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

// ─── Generate Form ────────────────────────────────────────────────────────────
const GenerateForm = ({ onGenerated, generating }) => {
  const [form, setForm] = useState({
    company: '', role: '', skills: '', difficulty: 'Mixed', rounds: '3',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.company.trim()) e.company = 'Company is required';
    if (!form.role.trim())    e.role    = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
    onGenerated({ company: form.company, role: form.role, skills, difficulty: form.difficulty, rounds: Number(form.rounds) });
  };

  const POPULAR_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Infosys', 'TCS', 'Wipro', 'Flipkart', 'Meta'];
  const POPULAR_ROLES     = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer'];

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-primary-600/20 border border-primary-500/30 rounded-xl flex items-center justify-center text-xl">
          🤖
        </div>
        <div>
          <h2 className="text-slate-200 font-semibold">AI Interview Question Generator</h2>
          <p className="text-slate-500 text-xs">Powered by Google Gemini — tailored to company & role</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Company + Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Company Name *</label>
            <input
              className={`input-field ${errors.company ? 'border-red-500/70' : ''}`}
              placeholder="e.g. Google, Infosys…"
              value={form.company}
              onChange={(e) => { setForm({ ...form, company: e.target.value }); setErrors({ ...errors, company: '' }); }}
            />
            {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
            {/* Quick picks */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_COMPANIES.map((c) => (
                <button key={c} type="button"
                  className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded border border-slate-700 hover:border-slate-500 transition-all"
                  onClick={() => setForm({ ...form, company: c })}
                >{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Role / Position *</label>
            <input
              className={`input-field ${errors.role ? 'border-red-500/70' : ''}`}
              placeholder="e.g. Software Engineer…"
              value={form.role}
              onChange={(e) => { setForm({ ...form, role: e.target.value }); setErrors({ ...errors, role: '' }); }}
            />
            {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_ROLES.map((r) => (
                <button key={r} type="button"
                  className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded border border-slate-700 hover:border-slate-500 transition-all"
                  onClick={() => setForm({ ...form, role: r })}
                >{r}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="label">Skills / Technologies</label>
          <input
            className="input-field"
            placeholder="e.g. React, Node.js, SQL, System Design (comma separated)"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />
          <p className="text-slate-600 text-xs mt-1">Separate multiple skills with commas for targeted questions</p>
        </div>

        {/* Difficulty + Rounds */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Difficulty Level</label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map((d) => (
                <button key={d} type="button"
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.difficulty === d
                      ? DIFF_COLORS[d] + ' shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                  onClick={() => setForm({ ...form, difficulty: d })}
                >{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Interview Rounds</label>
            <div className="flex gap-2">
              {[3, 4, 5].map((n) => (
                <button key={n} type="button"
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    Number(form.rounds) === n
                      ? 'bg-primary-600/20 border-primary-500/50 text-primary-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                  onClick={() => setForm({ ...form, rounds: String(n) })}
                >{n}</button>
              ))}
            </div>
            <p className="text-slate-600 text-[10px] mt-1.5">Number of interview rounds to prepare for</p>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating with Gemini AI…
            </>
          ) : (
            <>✨ Generate Interview Questions</>
          )}
        </button>
      </form>
    </div>
  );
};

// ─── Results Panel ────────────────────────────────────────────────────────────
const ResultsPanel = ({ result, onReset }) => {
  const [activeTab,  setActiveTab]  = useState('hrQuestions');
  const [bookmarks,  setBookmarks]  = useState({});  // { tabKey: Set<index> }
  const [showStarred, setShowStarred] = useState(false);

  const toggleBookmark = (tabKey, idx) => {
    setBookmarks((prev) => {
      const set = new Set(prev[tabKey] || []);
      set.has(idx) ? set.delete(idx) : set.add(idx);
      return { ...prev, [tabKey]: set };
    });
  };

  const copyAll = (tabKey) => {
    const questions = result[tabKey] || [];
    const text = questions.map((q, i) => `${i + 1}. ${parseDifficulty(q).text}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${questions.length} questions copied!`);
  };

  const copyAllQuestions = () => {
    const lines = [];
    TABS.forEach((tab) => {
      const qs = result[tab.key] || [];
      if (qs.length) {
        lines.push(`\n=== ${tab.label.toUpperCase()} QUESTIONS ===`);
        qs.forEach((q, i) => lines.push(`${i + 1}. ${parseDifficulty(q).text}`));
      }
    });
    navigator.clipboard.writeText(lines.join('\n').trim());
    toast.success('All questions copied to clipboard!');
  };

  const totalBookmarks = Object.values(bookmarks).reduce((s, set) => s + set.size, 0);
  const totalQuestions = TABS.reduce((s, t) => s + (result[t.key]?.length || 0), 0);

  const currentQuestions = result[activeTab] || [];
  const currentBookmarks = bookmarks[activeTab] || new Set();

  const displayQuestions = showStarred
    ? currentQuestions.filter((_, i) => currentBookmarks.has(i))
    : currentQuestions;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Result header */}
      <div className="card bg-gradient-to-r from-primary-900/30 to-slate-900/60 border-primary-800/30">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded border ${DIFF_COLORS[result.difficulty || 'Mixed']}`}>
                {result.difficulty || 'Mixed'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{result.company}</h2>
            <p className="text-slate-400 text-sm">{result.role}</p>
            {result.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.skills.map((s) => (
                  <span key={s} className="text-[10px] bg-primary-500/10 border border-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {result.overview && (
              <p className="text-slate-500 text-xs mt-2 leading-relaxed italic">"{result.overview}"</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold text-primary-400">{totalQuestions}</p>
            <p className="text-slate-500 text-xs">questions generated</p>
            {totalBookmarks > 0 && (
              <p className="text-yellow-400 text-xs mt-0.5">⭐ {totalBookmarks} starred</p>
            )}
          </div>
        </div>

        {/* Prep tips */}
        {result.tips?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-xs font-semibold mb-2">💡 PREPARATION TIPS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-400">
                  <span className="text-primary-500 flex-shrink-0">→</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Questions panel */}
      <div className="card p-0 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-800 overflow-x-auto">
          {TABS.map((tab) => {
            const count  = result[tab.key]?.length || 0;
            const stars  = (bookmarks[tab.key] || new Set()).size;
            if (!count) return null;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setShowStarred(false); }}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                <span className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{count}</span>
                {stars > 0 && (
                  <span className="text-yellow-400 text-xs">⭐{stars}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-slate-500 text-xs">{TABS.find((t) => t.key === activeTab)?.desc}</p>
              {(bookmarks[activeTab] || new Set()).size > 0 && (
                <button
                  className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                    showStarred
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                  onClick={() => setShowStarred(!showStarred)}
                >
                  ⭐ {showStarred ? 'Show all' : `Starred (${(bookmarks[activeTab] || new Set()).size})`}
                </button>
              )}
            </div>
            <button
              className="text-xs text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-1.5"
              onClick={() => copyAll(activeTab)}
            >
              <CopyIcon /> Copy all
            </button>
          </div>

          <div className="space-y-2.5">
            {displayQuestions.length > 0 ? (
              displayQuestions.map((q, i) => {
                const actualIndex = showStarred
                  ? currentQuestions.indexOf(q)
                  : i;
                return (
                  <QuestionCard
                    key={actualIndex}
                    question={q}
                    index={showStarred ? actualIndex : i}
                    bookmarked={currentBookmarks.has(actualIndex)}
                    onBookmark={() => toggleBookmark(activeTab, actualIndex)}
                    showDifficulty={activeTab === 'technicalQuestions'}
                  />
                );
              })
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">
                {showStarred ? 'No starred questions in this tab.' : 'No questions in this category.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button className="btn-secondary text-sm flex items-center gap-2" onClick={onReset}>
          ← Generate New Set
        </button>
        <button className="btn-primary text-sm flex items-center gap-2" onClick={copyAllQuestions}>
          <CopyIcon /> Copy All Questions
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const InterviewPage = () => {
  const [result,      setResult]      = useState(null);
  const [generating,  setGenerating]  = useState(false);
  const [history,     setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await aiService.getInterviewHistory({ limit: 10 });
      setHistory(data.data || []);
    } catch {
      // History is non-critical
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleGenerate = async (formData) => {
    setGenerating(true);
    setResult(null);
    try {
      const { data } = await aiService.generateInterview(formData);
      setResult(data.data);
      toast.success('Interview questions generated!');
      fetchHistory(); // refresh history
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate questions. Please try again.';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadSession = async (id) => {
    try {
      const { data } = await aiService.getInterviewSession(id);
      setResult(data.data);
      setShowHistory(false);
    } catch {
      toast.error('Failed to load session');
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await aiService.deleteInterviewSession(id);
      toast.success('Session deleted');
      setHistory((prev) => prev.filter((s) => s._id !== id));
      if (result?._id === id) setResult(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex gap-5">
        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Generating loading state */}
          {generating && (
            <div className="card text-center py-12">
              <div className="w-16 h-16 bg-primary-600/20 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl animate-bounce">🤖</span>
              </div>
              <p className="text-slate-300 font-semibold text-lg">Generating your interview set…</p>
              <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto">
                Gemini AI is crafting HR, technical, project, and system design questions tailored to your target
              </p>
              <div className="mt-6 max-w-xs mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}

          {/* Form (show when no result and not generating) */}
          {!result && !generating && (
            <GenerateForm onGenerated={handleGenerate} generating={generating} />
          )}

          {/* Results */}
          {result && !generating && (
            <ResultsPanel
              result={result}
              onReset={() => setResult(null)}
            />
          )}
        </div>

        {/* ── History sidebar ───────────────────────────────────────── */}
        <div className={`flex-shrink-0 transition-all duration-300 ${showHistory ? 'w-72' : 'w-0 overflow-hidden'} hidden lg:block`}>
          {showHistory && (
            <div className="card p-0 overflow-hidden h-fit sticky top-24">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h3 className="text-slate-300 font-medium text-sm">Past Sessions</h3>
                <span className="text-slate-500 text-xs">{history.length}</span>
              </div>
              <div className="p-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {histLoading ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : history.length > 0 ? (
                  <div className="space-y-1">
                    {history.map((session) => (
                      <HistoryItem
                        key={session._id}
                        session={session}
                        isActive={result?._id === session._id}
                        onClick={() => handleLoadSession(session._id)}
                        onDelete={handleDeleteSession}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-xs text-center py-8">No past sessions yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History toggle button */}
      {history.length > 0 && (
        <button
          className="fixed bottom-6 right-6 lg:static lg:hidden btn-secondary text-sm flex items-center gap-2 mt-4"
          onClick={() => setShowHistory(!showHistory)}
        >
          <ClockIcon />
          {showHistory ? 'Hide History' : `History (${history.length})`}
        </button>
      )}

      {/* Desktop history toggle in toolbar */}
      <div className="hidden lg:flex justify-end mt-2">
        {history.length > 0 && (
          <button
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
            onClick={() => setShowHistory(!showHistory)}
          >
            <ClockIcon />
            {showHistory ? 'Hide past sessions' : `Show past sessions (${history.length})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;