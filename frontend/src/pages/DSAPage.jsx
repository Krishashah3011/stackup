import { useState, useEffect, useCallback } from 'react';
import { dsaService } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack & Queue',
  'Hashing', 'Trees', 'Graphs', 'Dynamic Programming',
];

const TOPIC_META = {
  'Arrays':               { emoji: '📋', hex: '#6366f1', tag: 'Foundation'  },
  'Strings':              { emoji: '🔤', hex: '#10b981', tag: 'Foundation'  },
  'Linked List':          { emoji: '🔗', hex: '#a855f7', tag: 'Intermediate'},
  'Stack & Queue':        { emoji: '📚', hex: '#f59e0b', tag: 'Intermediate'},
  'Hashing':              { emoji: '#️⃣', hex: '#22c55e', tag: 'Intermediate'},
  'Trees':                { emoji: '🌳', hex: '#06b6d4', tag: 'Advanced'    },
  'Graphs':               { emoji: '🕸️', hex: '#ef4444', tag: 'Advanced'    },
  'Dynamic Programming':  { emoji: '⚡', hex: '#8b5cf6', tag: 'Advanced'    },
};

const TAG_COLORS = {
  'Foundation':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Intermediate': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Advanced':     'bg-red-500/10 text-red-400 border-red-500/20',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const CodeIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Animated SVG Ring ────────────────────────────────────────────────────────
const Ring = ({ value = 0, color = '#6366f1', size = 80, stroke = 8 }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
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

// ─── Modal wrapper ────────────────────────────────────────────────────────────
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

// ─── Summary banner ───────────────────────────────────────────────────────────
const SummaryBanner = ({ summary, onAddAll }) => {
  if (!summary) return null;
  const { overallProgress, totalSolved, totalProblems, topicsTracked, completedTopics, bestTopic, weakestTopic, untrackedTopics } = summary;

  return (
    <div className="card bg-gradient-to-r from-primary-900/30 to-slate-900/60 border-primary-800/30">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Ring + overall */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative">
            <Ring value={overallProgress} color="#6366f1" size={88} stroke={9} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{overallProgress}%</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Overall Progress</p>
            <p className="text-3xl font-bold text-primary-400 mt-0.5">{totalSolved}<span className="text-slate-500 text-base font-normal">/{totalProblems}</span></p>
            <p className="text-slate-500 text-xs mt-0.5">problems solved</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-slate-700" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          <div>
            <p className="text-slate-500 text-xs">Topics Tracked</p>
            <p className="text-white font-bold text-xl mt-0.5">{topicsTracked}<span className="text-slate-600 text-sm font-normal">/8</span></p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Completed</p>
            <p className="text-green-400 font-bold text-xl mt-0.5">{completedTopics}</p>
          </div>
          {bestTopic && (
            <div>
              <p className="text-slate-500 text-xs">Best Topic</p>
              <p className="text-white font-medium text-sm mt-0.5 truncate">{bestTopic.topic}</p>
              <p className="text-accent-400 text-xs">{bestTopic.progress}%</p>
            </div>
          )}
          {weakestTopic && (
            <div>
              <p className="text-slate-500 text-xs">Needs Work</p>
              <p className="text-white font-medium text-sm mt-0.5 truncate">{weakestTopic.topic}</p>
              <p className="text-yellow-400 text-xs">{weakestTopic.progress}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Untracked topics hint */}
      {untrackedTopics?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            Not yet tracking: <span className="text-slate-400">{untrackedTopics.join(', ')}</span>
          </p>
          {untrackedTopics.length > 1 && (
            <button
              className="text-primary-400 text-xs hover:text-primary-300 transition-colors flex-shrink-0 underline-offset-2 hover:underline"
              onClick={onAddAll}
            >
              Add all {untrackedTopics.length} at once →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Topic Card ───────────────────────────────────────────────────────────────
const TopicCard = ({ record, onEdit, onDelete, onIncrement, incrementing }) => {
  const meta     = TOPIC_META[record.topic] || { emoji: '📌', hex: '#6366f1', tag: 'Foundation' };
  const tagCls   = TAG_COLORS[meta.tag] || TAG_COLORS['Foundation'];
  const isDone   = record.progress === 100;
  const circ     = 2 * Math.PI * 34; // r=34 for size=80, stroke=8 => r=(80-8)/2=36 actually
  const r        = 34;
  const dash     = (record.progress / 100) * (2 * Math.PI * r);

  return (
    <div className={`card hover:border-slate-700 transition-all duration-200 group flex flex-col ${isDone ? 'border-green-500/20 bg-green-500/5' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${meta.hex}20`, border: `1px solid ${meta.hex}40` }}
          >
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <h3 className="text-slate-200 font-semibold text-sm truncate">{record.topic}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${tagCls}`}>
              {meta.tag}
            </span>
          </div>
        </div>
        {/* Action buttons - visible on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <button
            className="text-slate-600 hover:text-primary-400 transition-colors p-1.5 rounded-lg hover:bg-primary-500/10"
            onClick={() => onEdit(record)}
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            onClick={() => onDelete(record)}
            title="Remove"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Ring + count */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-shrink-0">
          <svg width={80} height={80} className="-rotate-90">
            <circle cx={40} cy={40} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
            <circle
              cx={40} cy={40} r={r} fill="none"
              stroke={isDone ? '#10b981' : meta.hex} strokeWidth={8}
              strokeDasharray={`${dash} ${2 * Math.PI * r}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white leading-none">{record.progress}</span>
            <span className="text-slate-500 text-[9px] leading-none">%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold" style={{ color: isDone ? '#10b981' : meta.hex }}>
              {record.solvedProblems}
            </span>
            <span className="text-slate-500 text-sm">/ {record.totalProblems}</span>
          </div>
          <p className="text-slate-500 text-xs">problems solved</p>

          {/* Progress bar */}
          <div className="mt-2.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${record.progress}%`,
                backgroundColor: isDone ? '#10b981' : meta.hex,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer: +1 quick solve */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        {isDone ? (
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed!
          </div>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-150 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => onIncrement(record._id)}
            disabled={incrementing === record._id}
          >
            {incrementing === record._id ? (
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Mark 1 Solved
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Untracked topic tile (grayed out placeholder) ────────────────────────────
const UntrackedCard = ({ topic, onAdd }) => {
  const meta = TOPIC_META[topic] || { emoji: '📌', hex: '#6366f1', tag: 'Foundation' };
  return (
    <button
      onClick={() => onAdd(topic)}
      className="card border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/40 hover:border-slate-600 transition-all duration-200 flex flex-col items-center justify-center gap-2 py-8 group cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ backgroundColor: `${meta.hex}15` }}>
        {meta.emoji}
      </div>
      <p className="text-slate-600 group-hover:text-slate-400 font-medium text-sm transition-colors">{topic}</p>
      <span className="text-primary-500 text-xs group-hover:text-primary-400 transition-colors flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add
      </span>
    </button>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DSAPage = () => {
  const [records,  setRecords]    = useState([]);
  const [summary,  setSummary]    = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState(false);
  const [incrementing, setIncrementing] = useState(null);

  // Modals
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editRecord,    setEditRecord]    = useState(null);
  const [deleteRecord,  setDeleteRecord]  = useState(null);
  const [prefillTopic,  setPrefillTopic]  = useState(null);

  // Add/edit form
  const [form, setForm] = useState({ topic: '', totalProblems: '', solvedProblems: '0' });
  const [formErrors, setFormErrors] = useState({});

  // Bulk form: { topic -> { total, solved } }
  const [bulkForm, setBulkForm] = useState({});

  const trackedTopics   = records.map((r) => r.topic);
  const untrackedTopics = ALL_TOPICS.filter((t) => !trackedTopics.includes(t));

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [progressRes, summaryRes] = await Promise.all([
        dsaService.getAll(),
        dsaService.getSummary(),
      ]);
      setRecords(progressRes.data.data);
      setSummary(summaryRes.data.data);
    } catch {
      toast.error('Failed to load DSA progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Open add modal ─────────────────────────────────────────────────────
  const openAdd = (prefTopic = null) => {
    const defaultTopic = prefTopic || untrackedTopics[0] || '';
    setForm({ topic: defaultTopic, totalProblems: '', solvedProblems: '0' });
    setFormErrors({});
    setPrefillTopic(prefTopic);
    setShowAddModal(true);
  };

  // ── Open bulk modal ────────────────────────────────────────────────────
  const openBulk = () => {
    const init = {};
    untrackedTopics.forEach((t) => { init[t] = { total: '', solved: '0', enabled: untrackedTopics.length <= 4 }; });
    setBulkForm(init);
    setShowBulkModal(true);
  };

  // ── Open edit ─────────────────────────────────────────────────────────
  const openEdit = (rec) => {
    setForm({ topic: rec.topic, totalProblems: String(rec.totalProblems), solvedProblems: String(rec.solvedProblems) });
    setFormErrors({});
    setEditRecord(rec);
  };

  // ── Validate add/edit form ─────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!form.topic) e.topic = 'Topic is required';
    if (!form.totalProblems || Number(form.totalProblems) < 1) e.totalProblems = 'Must be at least 1';
    if (Number(form.solvedProblems) < 0) e.solvedProblems = 'Cannot be negative';
    if (Number(form.solvedProblems) > Number(form.totalProblems)) e.solvedProblems = 'Cannot exceed total';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit add ─────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await dsaService.create({
        topic:         form.topic,
        totalProblems: Number(form.totalProblems),
        solvedProblems: Number(form.solvedProblems),
      });
      toast.success(`"${form.topic}" added!`);
      setShowAddModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add topic');
    } finally {
      setSaving(false);
    }
  };

  // ── Submit edit ────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await dsaService.update(editRecord._id, {
        totalProblems:  Number(form.totalProblems),
        solvedProblems: Number(form.solvedProblems),
      });
      toast.success(`"${editRecord.topic}" updated`);
      setEditRecord(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Quick increment ────────────────────────────────────────────────────
  const handleIncrement = async (id) => {
    setIncrementing(id);
    try {
      const { data } = await dsaService.increment(id);
      // Optimistic update in place
      setRecords((prev) => prev.map((r) => r._id === id ? data.data : r));
      toast.success(data.message);
      // Refresh summary silently
      dsaService.getSummary().then(({ data: s }) => setSummary(s.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to increment');
    } finally {
      setIncrementing(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteRecord) return;
    try {
      await dsaService.delete(deleteRecord._id);
      toast.success(`"${deleteRecord.topic}" removed`);
      setDeleteRecord(null);
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Bulk add ───────────────────────────────────────────────────────────
  const handleBulkAdd = async (e) => {
    e.preventDefault();
    const topics = Object.entries(bulkForm)
      .filter(([, v]) => v.enabled && v.total && Number(v.total) >= 1)
      .map(([topic, v]) => ({
        topic,
        totalProblems:  Number(v.total),
        solvedProblems: Number(v.solved) || 0,
      }));

    if (topics.length === 0) {
      toast.error('Enable at least one topic with a valid total');
      return;
    }
    setSaving(true);
    try {
      const { data } = await dsaService.bulkCreate(topics);
      toast.success(data.message);
      setShowBulkModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk add failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  }

  const hasRecords = records.length > 0;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Summary Banner */}
      {hasRecords && (
        <SummaryBanner summary={summary} onAddAll={openBulk} />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-slate-400 text-sm">
          {records.length} / {ALL_TOPICS.length} topics tracked
          {summary?.completedTopics > 0 && ` · ${summary.completedTopics} completed`}
        </p>
        <div className="flex items-center gap-2">
          {untrackedTopics.length > 1 && (
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
            disabled={untrackedTopics.length === 0}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Topic
          </button>
        </div>
      </div>

      {/* Empty state (no records at all) */}
      {!hasRecords && (
        <EmptyState
          icon={CodeIcon}
          title="No DSA topics tracked yet"
          description="Track your problem-solving progress across 8 essential DSA topics. Use Bulk Add to set up all topics at once."
          action={
            <div className="flex gap-3 flex-wrap justify-center">
              <button className="btn-primary" onClick={openBulk}>Bulk Add All Topics</button>
              <button className="btn-secondary" onClick={() => openAdd()}>Add Single Topic</button>
            </div>
          }
        />
      )}

      {/* Topic cards grid */}
      {hasRecords && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {records.map((rec) => (
            <TopicCard
              key={rec._id}
              record={rec}
              onEdit={openEdit}
              onDelete={setDeleteRecord}
              onIncrement={handleIncrement}
              incrementing={incrementing}
            />
          ))}
          {/* Untracked topic placeholders */}
          {untrackedTopics.map((topic) => (
            <UntrackedCard key={topic} topic={topic} onAdd={openAdd} />
          ))}
        </div>
      )}

      {/* All 8 topics present — no untracked */}
      {untrackedTopics.length === 0 && hasRecords && (
        <div className="text-center py-3">
          <p className="text-slate-500 text-sm">
            🎯 All 8 topics are being tracked.
            {summary?.completedTopics === 8
              ? ' Incredible — all topics completed! 🏆'
              : ' Keep solving!'}
          </p>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* Add single topic */}
      {showAddModal && (
        <Modal title="Add DSA Topic" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4" noValidate>
            <div>
              <label className="label">Topic</label>
              <select
                className={`input-field ${formErrors.topic ? 'border-red-500/70' : ''}`}
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              >
                <option value="" disabled className="bg-slate-800">Select a topic…</option>
                {untrackedTopics.map((t) => (
                  <option key={t} value={t} className="bg-slate-800">
                    {TOPIC_META[t]?.emoji} {t} — {TOPIC_META[t]?.tag}
                  </option>
                ))}
              </select>
              {formErrors.topic && <p className="text-red-400 text-xs mt-1">{formErrors.topic}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Problems</label>
                <input
                  type="number" min="1"
                  className={`input-field ${formErrors.totalProblems ? 'border-red-500/70' : ''}`}
                  placeholder="e.g. 50"
                  value={form.totalProblems}
                  onChange={(e) => setForm({ ...form, totalProblems: e.target.value })}
                />
                {formErrors.totalProblems && <p className="text-red-400 text-xs mt-1">{formErrors.totalProblems}</p>}
              </div>
              <div>
                <label className="label">Already Solved</label>
                <input
                  type="number" min="0"
                  className={`input-field ${formErrors.solvedProblems ? 'border-red-500/70' : ''}`}
                  placeholder="e.g. 20"
                  value={form.solvedProblems}
                  onChange={(e) => setForm({ ...form, solvedProblems: e.target.value })}
                />
                {formErrors.solvedProblems && <p className="text-red-400 text-xs mt-1">{formErrors.solvedProblems}</p>}
              </div>
            </div>

            {/* Live preview */}
            {form.totalProblems && Number(form.totalProblems) > 0 && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Progress preview</span>
                  <span className="text-slate-400">
                    {Math.round((Math.min(Number(form.solvedProblems)||0, Number(form.totalProblems)) / Number(form.totalProblems)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round(((Number(form.solvedProblems)||0) / (Number(form.totalProblems)||1)) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Add Topic'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit topic */}
      {editRecord && (
        <Modal title={`Edit — ${editRecord.topic}`} onClose={() => setEditRecord(null)}>
          <form onSubmit={handleUpdate} className="space-y-4" noValidate>
            {/* Topic badge */}
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
              <span className="text-xl">{TOPIC_META[editRecord.topic]?.emoji}</span>
              <div>
                <p className="text-slate-200 font-medium text-sm">{editRecord.topic}</p>
                <p className="text-slate-500 text-xs">{TOPIC_META[editRecord.topic]?.tag}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Problems</label>
                <input
                  type="number" min="1"
                  className={`input-field ${formErrors.totalProblems ? 'border-red-500/70' : ''}`}
                  value={form.totalProblems}
                  onChange={(e) => setForm({ ...form, totalProblems: e.target.value })}
                />
                {formErrors.totalProblems && <p className="text-red-400 text-xs mt-1">{formErrors.totalProblems}</p>}
              </div>
              <div>
                <label className="label">Solved So Far</label>
                <input
                  type="number" min="0"
                  className={`input-field ${formErrors.solvedProblems ? 'border-red-500/70' : ''}`}
                  value={form.solvedProblems}
                  onChange={(e) => setForm({ ...form, solvedProblems: e.target.value })}
                />
                {formErrors.solvedProblems && <p className="text-red-400 text-xs mt-1">{formErrors.solvedProblems}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Update Progress'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditRecord(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk add */}
      {showBulkModal && (
        <Modal title="Bulk Add DSA Topics" onClose={() => setShowBulkModal(false)} wide>
          <form onSubmit={handleBulkAdd}>
            <p className="text-slate-400 text-sm mb-4">
              Enable the topics you want to track and fill in problem counts. Already-tracked topics are skipped automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {untrackedTopics.map((topic) => {
                const meta = TOPIC_META[topic];
                const val  = bulkForm[topic] || { total: '', solved: '0', enabled: false };
                return (
                  <div
                    key={topic}
                    className={`border rounded-xl p-4 transition-all duration-150 ${
                      val.enabled ? 'border-primary-500/40 bg-primary-500/5' : 'border-slate-700 bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-indigo-500"
                        checked={val.enabled}
                        onChange={(e) => setBulkForm((f) => ({ ...f, [topic]: { ...val, enabled: e.target.checked } }))}
                      />
                      <span className="text-base">{meta?.emoji}</span>
                      <div>
                        <p className="text-slate-200 font-medium text-sm">{topic}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TAG_COLORS[meta?.tag]}`}>{meta?.tag}</span>
                      </div>
                    </div>
                    {val.enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-500 text-xs mb-1 block">Total</label>
                          <input
                            type="number" min="1"
                            className="input-field text-sm py-1.5"
                            placeholder="50"
                            value={val.total}
                            onChange={(e) => setBulkForm((f) => ({ ...f, [topic]: { ...val, total: e.target.value } }))}
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 text-xs mb-1 block">Solved</label>
                          <input
                            type="number" min="0"
                            className="input-field text-sm py-1.5"
                            placeholder="0"
                            value={val.solved}
                            onChange={(e) => setBulkForm((f) => ({ ...f, [topic]: { ...val, solved: e.target.value } }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Adding…' : `Add ${Object.values(bulkForm).filter((v) => v.enabled).length} Topic(s)`}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteRecord && (
        <Modal title="Remove Topic?" onClose={() => setDeleteRecord(null)}>
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Remove <span className="text-white font-semibold">{deleteRecord.topic}</span> from your tracker?{' '}
              Your progress ({deleteRecord.solvedProblems}/{deleteRecord.totalProblems} solved) will be lost.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors text-sm"
                onClick={handleDelete}
              >
                Remove
              </button>
              <button className="btn-secondary flex-1" onClick={() => setDeleteRecord(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DSAPage;