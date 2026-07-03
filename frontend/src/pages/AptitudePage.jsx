import { useState, useEffect, useCallback } from 'react';
import { aptitudeService } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
];

const CATEGORY_META = {
  'Quantitative Aptitude': {
    emoji: '🔢', hex: '#6366f1',
    desc: 'Numbers, percentages, algebra, geometry',
    topics: ['Percentages', 'Ratios', 'Averages', 'Time & Work', 'Speed & Distance',
             'Profit & Loss', 'Simple Interest', 'Permutations', 'Probability', 'Number System'],
  },
  'Logical Reasoning': {
    emoji: '🧩', hex: '#a855f7',
    desc: 'Patterns, sequences, puzzles, coding-decoding',
    topics: ['Blood Relations', 'Direction Sense', 'Coding-Decoding', 'Syllogism', 'Seating Arrangement',
             'Series Completion', 'Analogy', 'Classification', 'Statement & Conclusion', 'Data Sufficiency'],
  },
  'Verbal Ability': {
    emoji: '📖', hex: '#10b981',
    desc: 'Grammar, vocabulary, comprehension, fill-in-blanks',
    topics: ['Reading Comprehension', 'Sentence Correction', 'Fill in the Blanks', 'Para Jumbles',
             'Vocabulary', 'Idioms & Phrases', 'Synonyms & Antonyms', 'Sentence Completion', 'Error Detection', 'Cloze Test'],
  },
  'Data Interpretation': {
    emoji: '📊', hex: '#f59e0b',
    desc: 'Bar charts, pie charts, line graphs, tables',
    topics: ['Bar Graph', 'Pie Chart', 'Line Graph', 'Table Chart', 'Mixed Graph',
             'Caselet DI', 'Radar Chart', 'Missing Data', 'Data Comparison', 'Data Sufficiency DI'],
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChartIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── SVG Arc ring ─────────────────────────────────────────────────────────────
const Ring = ({ value = 0, color = '#6366f1', size = 72, stroke = 7 }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
      />
    </svg>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className={`bg-slate-900 border border-slate-700 rounded-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-slate-100 font-semibold">{title}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <CloseIcon />
        </button>
      </div>
      <div className="px-6 py-5 overflow-y-auto">{children}</div>
    </div>
  </div>
);

// ─── Summary Banner ───────────────────────────────────────────────────────────
const SummaryBanner = ({ summary, onAddAll }) => {
  if (!summary) return null;
  const { avgScore, avgAccuracy, categoriesTracked, totalTopicsCompleted,
          totalTopicsAvail, bestCategory, weakestCategory, untrackedCategories } = summary;

  return (
    <div className="card bg-gradient-to-r from-purple-900/20 to-slate-900/60 border-purple-800/20">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Dual rings */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Ring value={avgScore} color="#a855f7" size={80} stroke={8} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-none">{avgScore}</span>
                <span className="text-slate-600 text-[9px]">score</span>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-1">Avg Score</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative">
              <Ring value={avgAccuracy} color="#10b981" size={80} stroke={8} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-none">{avgAccuracy}</span>
                <span className="text-slate-600 text-[9px]">acc%</span>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-1">Avg Accuracy</p>
          </div>
        </div>

        <div className="hidden sm:block w-px bg-slate-700" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          <div>
            <p className="text-slate-500 text-xs">Categories</p>
            <p className="text-white font-bold text-xl mt-0.5">{categoriesTracked}<span className="text-slate-600 text-sm font-normal">/4</span></p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Topics Done</p>
            <p className="text-purple-400 font-bold text-xl mt-0.5">
              {totalTopicsCompleted}
              <span className="text-slate-600 text-sm font-normal">/{totalTopicsAvail}</span>
            </p>
          </div>
          {bestCategory && (
            <div>
              <p className="text-slate-500 text-xs">Strongest</p>
              <p className="text-white font-medium text-xs mt-0.5 leading-snug">{bestCategory.category}</p>
              <p className="text-green-400 text-xs">{bestCategory.score}%</p>
            </div>
          )}
          {weakestCategory && (
            <div>
              <p className="text-slate-500 text-xs">Needs Work</p>
              <p className="text-white font-medium text-xs mt-0.5 leading-snug">{weakestCategory.category}</p>
              <p className="text-yellow-400 text-xs">{weakestCategory.score}%</p>
            </div>
          )}
        </div>
      </div>

      {untrackedCategories?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-slate-500 text-xs">
            Not tracking: <span className="text-slate-400">{untrackedCategories.join(', ')}</span>
          </p>
          {untrackedCategories.length > 1 && (
            <button
              className="text-purple-400 text-xs hover:text-purple-300 transition-colors hover:underline underline-offset-2 flex-shrink-0"
              onClick={onAddAll}
            >
              Add all {untrackedCategories.length} at once →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Score Gauge (semi-circle style using full ring clipped) ──────────────────
const ScoreGauge = ({ value, color, label, size = 56 }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative" style={{ width: size, height: size }}>
      <Ring value={value} color={color} size={size} stroke={6} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
    </div>
    <p className="text-slate-500 text-[10px]">{label}</p>
  </div>
);

// ─── Category Card ────────────────────────────────────────────────────────────
const CategoryCard = ({ record, onEdit, onDelete, onLogSession }) => {
  const meta    = CATEGORY_META[record.category] || { emoji: '📌', hex: '#6366f1', desc: '', topics: [] };
  const topicPct = record.totalTopics > 0
    ? Math.round((record.completedTopics / record.totalTopics) * 100)
    : 0;

  const scoreColor =
    record.score >= 80 ? '#10b981' :
    record.score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="card hover:border-slate-700 transition-all duration-200 group flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: `${meta.hex}18`, border: `1px solid ${meta.hex}35` }}
          >
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <h3 className="text-slate-200 font-semibold text-sm truncate">{record.category}</h3>
            <p className="text-slate-600 text-xs truncate mt-0.5">{meta.desc}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <button
            className="text-slate-600 hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-purple-500/10"
            onClick={() => onEdit(record)} title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            onClick={() => onDelete(record)} title="Remove"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Score & Accuracy rings */}
      <div className="flex items-center justify-around py-2 bg-slate-800/40 rounded-xl">
        <ScoreGauge value={record.score}    color={scoreColor}  label="Score %"    />
        <div className="w-px h-10 bg-slate-700" />
        <ScoreGauge value={record.accuracy} color="#6366f1"     label="Accuracy %" />
        <div className="w-px h-10 bg-slate-700" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-bold text-white">{record.completedTopics}</span>
          <span className="text-slate-600 text-[10px]">/{record.totalTopics} topics</span>
        </div>
      </div>

      {/* Topics progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">Topics completed</span>
          <span className="text-slate-400">{topicPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${topicPct}%`, backgroundColor: meta.hex }}
          />
        </div>
      </div>

      {/* Log session button */}
      <button
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600"
        onClick={() => onLogSession(record)}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Log Practice Session
      </button>
    </div>
  );
};

// ─── Untracked placeholder ────────────────────────────────────────────────────
const UntrackedCard = ({ category, onAdd }) => {
  const meta = CATEGORY_META[category] || { emoji: '📌', hex: '#6366f1' };
  return (
    <button
      onClick={() => onAdd(category)}
      className="card border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/40 hover:border-slate-600 transition-all duration-200 flex flex-col items-center justify-center gap-2 py-10 group cursor-pointer"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl opacity-40 group-hover:opacity-70 transition-opacity"
        style={{ backgroundColor: `${meta.hex}12` }}
      >
        {meta.emoji}
      </div>
      <p className="text-slate-600 group-hover:text-slate-400 font-medium text-sm transition-colors text-center px-2">{category}</p>
      <span className="text-purple-500 text-xs group-hover:text-purple-400 transition-colors flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add
      </span>
    </button>
  );
};

// ─── Slider input component ───────────────────────────────────────────────────
const SliderField = ({ label, value, onChange, color = '#6366f1' }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label className="text-slate-400 text-sm font-medium">{label}</label>
      <span className="text-white font-bold text-lg" style={{ color }}>{value}%</span>
    </div>
    <input
      type="range" min="0" max="100" step="1"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700"
      style={{ accentColor: color }}
    />
    <div className="flex justify-between text-slate-700 text-[10px] mt-1">
      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const AptitudePage = () => {
  const [records,  setRecords]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Modal states
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editRecord,    setEditRecord]    = useState(null);
  const [deleteRecord,  setDeleteRecord]  = useState(null);
  const [sessionRecord, setSessionRecord] = useState(null);

  // Add/edit form
  const [form, setForm] = useState({
    category: '', completedTopics: '0', totalTopics: '10', score: 0, accuracy: 0,
  });
  const [formErrors, setFormErrors] = useState({});

  // Session form
  const [sessionForm, setSessionForm] = useState({ score: 70, accuracy: 70, topicsCompleted: 1 });

  // Bulk form
  const [bulkForm, setBulkForm] = useState({});

  const trackedCategories   = records.map((r) => r.category);
  const untrackedCategories = ALL_CATEGORIES.filter((c) => !trackedCategories.includes(c));

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [progressRes, summaryRes] = await Promise.all([
        aptitudeService.getAll(),
        aptitudeService.getSummary(),
      ]);
      setRecords(progressRes.data.data);
      setSummary(summaryRes.data.data);
    } catch {
      toast.error('Failed to load aptitude progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Open add ──────────────────────────────────────────────────────────
  const openAdd = (prefCategory = null) => {
    const defaultCat = prefCategory || untrackedCategories[0] || '';
    setForm({ category: defaultCat, completedTopics: '0', totalTopics: '10', score: 0, accuracy: 0 });
    setFormErrors({});
    setShowAddModal(true);
  };

  // ── Open bulk ─────────────────────────────────────────────────────────
  const openBulk = () => {
    const init = {};
    untrackedCategories.forEach((c) => {
      init[c] = { enabled: untrackedCategories.length <= 2, score: 0, accuracy: 0, completedTopics: 0, totalTopics: 10 };
    });
    setBulkForm(init);
    setShowBulkModal(true);
  };

  // ── Open session ──────────────────────────────────────────────────────
  const openSession = (rec) => {
    setSessionForm({ score: rec.score, accuracy: rec.accuracy, topicsCompleted: 1 });
    setSessionRecord(rec);
  };

  // ── Validate add/edit ─────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!form.category) e.category = 'Category is required';
    if (!form.totalTopics || Number(form.totalTopics) < 1) e.totalTopics = 'Must be at least 1';
    if (Number(form.completedTopics) > Number(form.totalTopics)) e.completedTopics = 'Cannot exceed total';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit add ────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await aptitudeService.create({
        category:        form.category,
        completedTopics: Number(form.completedTopics),
        totalTopics:     Number(form.totalTopics),
        score:           form.score,
        accuracy:        form.accuracy,
      });
      toast.success(`"${form.category}" added!`);
      setShowAddModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  // ── Submit edit ───────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await aptitudeService.update(editRecord._id, {
        completedTopics: Number(form.completedTopics),
        totalTopics:     Number(form.totalTopics),
        score:           form.score,
        accuracy:        form.accuracy,
      });
      toast.success(`"${editRecord.category}" updated`);
      setEditRecord(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Submit session ────────────────────────────────────────────────────
  const handleLogSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await aptitudeService.logSession(sessionRecord._id, sessionForm);
      toast.success(`Session logged for "${sessionRecord.category}"`);
      setRecords((prev) => prev.map((r) => r._id === sessionRecord._id ? data.data : r));
      setSessionRecord(null);
      aptitudeService.getSummary().then(({ data: s }) => setSummary(s.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log session');
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk add ──────────────────────────────────────────────────────────
  const handleBulkAdd = async (e) => {
    e.preventDefault();
    const categories = Object.entries(bulkForm)
      .filter(([, v]) => v.enabled)
      .map(([category, v]) => ({
        category,
        completedTopics: Number(v.completedTopics) || 0,
        totalTopics:     Number(v.totalTopics)     || 10,
        score:           Number(v.score)            || 0,
        accuracy:        Number(v.accuracy)         || 0,
      }));

    if (categories.length === 0) {
      toast.error('Enable at least one category');
      return;
    }
    setSaving(true);
    try {
      const { data } = await aptitudeService.bulkCreate(categories);
      toast.success(data.message);
      setShowBulkModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk add failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteRecord) return;
    try {
      await aptitudeService.delete(deleteRecord._id);
      toast.success(`"${deleteRecord.category}" removed`);
      setDeleteRecord(null);
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ─── Open edit (fill form) ─────────────────────────────────────────────
  const openEdit = (rec) => {
    setForm({
      category:        rec.category,
      completedTopics: String(rec.completedTopics),
      totalTopics:     String(rec.totalTopics),
      score:           rec.score,
      accuracy:        rec.accuracy,
    });
    setFormErrors({});
    setEditRecord(rec);
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  const hasRecords = records.length > 0;

  // Shared slider form (used in both add and edit modals)
  const SliderSection = () => (
    <div className="space-y-5 p-4 bg-slate-800/50 rounded-xl">
      <SliderField
        label="Current Score"
        value={form.score}
        onChange={(v) => setForm((f) => ({ ...f, score: v }))}
        color="#a855f7"
      />
      <SliderField
        label="Accuracy"
        value={form.accuracy}
        onChange={(v) => setForm((f) => ({ ...f, accuracy: v }))}
        color="#10b981"
      />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Summary Banner */}
      {hasRecords && <SummaryBanner summary={summary} onAddAll={openBulk} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-slate-400 text-sm">
          {records.length} / {ALL_CATEGORIES.length} categories tracked
        </p>
        <div className="flex items-center gap-2">
          {untrackedCategories.length > 1 && (
            <button className="btn-secondary text-sm flex items-center gap-1.5" onClick={openBulk}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Bulk Add
            </button>
          )}
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => openAdd()}
            disabled={untrackedCategories.length === 0}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!hasRecords && (
        <EmptyState
          icon={ChartIcon}
          title="No aptitude categories tracked yet"
          description="Track scores and accuracy across 4 key aptitude areas. Use Bulk Add to set up everything at once."
          action={
            <div className="flex gap-3 flex-wrap justify-center">
              <button className="btn-primary" onClick={openBulk}>Bulk Add All Categories</button>
              <button className="btn-secondary" onClick={() => openAdd()}>Add Single Category</button>
            </div>
          }
        />
      )}

      {/* Category cards */}
      {hasRecords && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {records.map((rec) => (
            <CategoryCard
              key={rec._id}
              record={rec}
              onEdit={openEdit}
              onDelete={setDeleteRecord}
              onLogSession={openSession}
            />
          ))}
          {untrackedCategories.map((cat) => (
            <UntrackedCard key={cat} category={cat} onAdd={openAdd} />
          ))}
        </div>
      )}

      {/* All tracked note */}
      {untrackedCategories.length === 0 && hasRecords && (
        <p className="text-center text-slate-500 text-sm py-2">
          🎯 All 4 aptitude categories are tracked. Keep practicing!
        </p>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* Add modal */}
      {showAddModal && (
        <Modal title="Add Aptitude Category" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4" noValidate>
            <div>
              <label className="label">Category</label>
              <select
                className={`input-field ${formErrors.category ? 'border-red-500/70' : ''}`}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="" disabled className="bg-slate-800">Select a category…</option>
                {untrackedCategories.map((c) => (
                  <option key={c} value={c} className="bg-slate-800">
                    {CATEGORY_META[c]?.emoji} {c}
                  </option>
                ))}
              </select>
              {formErrors.category && <p className="text-red-400 text-xs mt-1">{formErrors.category}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Topics</label>
                <input type="number" min="1" className={`input-field ${formErrors.totalTopics ? 'border-red-500/70' : ''}`}
                  placeholder="10" value={form.totalTopics}
                  onChange={(e) => setForm({ ...form, totalTopics: e.target.value })} />
                {formErrors.totalTopics && <p className="text-red-400 text-xs mt-1">{formErrors.totalTopics}</p>}
              </div>
              <div>
                <label className="label">Completed</label>
                <input type="number" min="0" className={`input-field ${formErrors.completedTopics ? 'border-red-500/70' : ''}`}
                  placeholder="0" value={form.completedTopics}
                  onChange={(e) => setForm({ ...form, completedTopics: e.target.value })} />
                {formErrors.completedTopics && <p className="text-red-400 text-xs mt-1">{formErrors.completedTopics}</p>}
              </div>
            </div>

            <SliderSection />

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Add Category'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editRecord && (
        <Modal title={`Edit — ${editRecord.category}`} onClose={() => setEditRecord(null)}>
          <form onSubmit={handleUpdate} className="space-y-4" noValidate>
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
              <span className="text-2xl">{CATEGORY_META[editRecord.category]?.emoji}</span>
              <p className="text-slate-200 font-medium">{editRecord.category}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Topics</label>
                <input type="number" min="1" className="input-field"
                  value={form.totalTopics}
                  onChange={(e) => setForm({ ...form, totalTopics: e.target.value })} />
              </div>
              <div>
                <label className="label">Completed</label>
                <input type="number" min="0" className="input-field"
                  value={form.completedTopics}
                  onChange={(e) => setForm({ ...form, completedTopics: e.target.value })} />
              </div>
            </div>

            <SliderSection />

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Update'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditRecord(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Log session modal */}
      {sessionRecord && (
        <Modal title={`Log Session — ${sessionRecord.category}`} onClose={() => setSessionRecord(null)}>
          <form onSubmit={handleLogSession} className="space-y-5" noValidate>
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
              <span className="text-2xl">{CATEGORY_META[sessionRecord.category]?.emoji}</span>
              <div>
                <p className="text-slate-200 font-medium text-sm">{sessionRecord.category}</p>
                <p className="text-slate-500 text-xs">Current: {sessionRecord.score}% score · {sessionRecord.accuracy}% accuracy</p>
              </div>
            </div>

            <div className="space-y-5 p-4 bg-slate-800/50 rounded-xl">
              <SliderField
                label="Session Score"
                value={sessionForm.score}
                onChange={(v) => setSessionForm((f) => ({ ...f, score: v }))}
                color="#a855f7"
              />
              <SliderField
                label="Session Accuracy"
                value={sessionForm.accuracy}
                onChange={(v) => setSessionForm((f) => ({ ...f, accuracy: v }))}
                color="#10b981"
              />
            </div>

            <div>
              <label className="label">Topics Completed This Session</label>
              <input
                type="number" min="0" className="input-field"
                placeholder="How many topics did you cover?"
                value={sessionForm.topicsCompleted}
                onChange={(e) => setSessionForm((f) => ({ ...f, topicsCompleted: Number(e.target.value) }))}
              />
              <p className="text-slate-600 text-xs mt-1.5">
                Score is rolling average: new score weighted 30%, existing 70%
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Logging…' : 'Log Session'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setSessionRecord(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk add modal */}
      {showBulkModal && (
        <Modal title="Bulk Add Aptitude Categories" onClose={() => setShowBulkModal(false)} wide>
          <form onSubmit={handleBulkAdd}>
            <p className="text-slate-400 text-sm mb-4">
              Enable the categories you want to track and set initial scores.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {untrackedCategories.map((cat) => {
                const meta = CATEGORY_META[cat];
                const val  = bulkForm[cat] || { enabled: false, score: 0, accuracy: 0, completedTopics: 0, totalTopics: 10 };
                return (
                  <div
                    key={cat}
                    className={`border rounded-xl p-4 transition-all duration-150 ${
                      val.enabled ? 'border-purple-500/40 bg-purple-500/5' : 'border-slate-700 bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox" className="w-4 h-4 accent-purple-500"
                        checked={val.enabled}
                        onChange={(e) => setBulkForm((f) => ({ ...f, [cat]: { ...val, enabled: e.target.checked } }))}
                      />
                      <span className="text-xl">{meta?.emoji}</span>
                      <p className="text-slate-200 font-medium text-sm">{cat}</p>
                    </div>
                    {val.enabled && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-500 text-xs mb-1 block">Total Topics</label>
                            <input type="number" min="1" className="input-field text-sm py-1.5" placeholder="10"
                              value={val.totalTopics}
                              onChange={(e) => setBulkForm((f) => ({ ...f, [cat]: { ...val, totalTopics: e.target.value } }))} />
                          </div>
                          <div>
                            <label className="text-slate-500 text-xs mb-1 block">Completed</label>
                            <input type="number" min="0" className="input-field text-sm py-1.5" placeholder="0"
                              value={val.completedTopics}
                              onChange={(e) => setBulkForm((f) => ({ ...f, [cat]: { ...val, completedTopics: e.target.value } }))} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Score</span>
                            <span className="text-purple-400 font-medium">{val.score}%</span>
                          </div>
                          <input type="range" min="0" max="100" className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700"
                            style={{ accentColor: '#a855f7' }} value={val.score}
                            onChange={(e) => setBulkForm((f) => ({ ...f, [cat]: { ...val, score: Number(e.target.value) } }))} />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Accuracy</span>
                            <span className="text-green-400 font-medium">{val.accuracy}%</span>
                          </div>
                          <input type="range" min="0" max="100" className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700"
                            style={{ accentColor: '#10b981' }} value={val.accuracy}
                            onChange={(e) => setBulkForm((f) => ({ ...f, [cat]: { ...val, accuracy: Number(e.target.value) } }))} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Adding…' : `Add ${Object.values(bulkForm).filter((v) => v.enabled).length} Categor${Object.values(bulkForm).filter((v) => v.enabled).length === 1 ? 'y' : 'ies'}`}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteRecord && (
        <Modal title="Remove Category?" onClose={() => setDeleteRecord(null)}>
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Remove <span className="text-white font-semibold">{deleteRecord.category}</span> from your tracker?
              Your score ({deleteRecord.score}%) and progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors text-sm"
                onClick={handleDelete}
              >Remove</button>
              <button className="btn-secondary flex-1" onClick={() => setDeleteRecord(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AptitudePage;