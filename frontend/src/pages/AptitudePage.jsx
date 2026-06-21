import { useState, useEffect, useCallback } from 'react';
import { aptitudeService } from '../../services/api';
import ProgressBar from '../../components/common/ProgressBar';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
];

const CATEGORY_META = {
  'Quantitative Aptitude': { emoji: '🔢', color: 'primary', desc: 'Numbers, algebra, geometry' },
  'Logical Reasoning':     { emoji: '🧩', color: 'purple',  desc: 'Patterns, sequences, puzzles' },
  'Verbal Ability':        { emoji: '📖', color: 'accent',  desc: 'Grammar, vocab, comprehension' },
  'Data Interpretation':   { emoji: '📊', color: 'yellow',  desc: 'Charts, tables, graphs' },
};

const ChartIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h2 className="text-slate-100 font-semibold">{title}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const AptitudePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    category: '',
    completedTopics: '',
    totalTopics: '10',
    score: '',
    accuracy: '',
  });

  const availableCategories = CATEGORIES.filter((c) => !records.find((r) => r.category === c));

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await aptitudeService.getAll();
      setRecords(data.data);
    } catch {
      toast.error('Failed to load aptitude progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const openAdd = () => {
    setForm({ category: availableCategories[0] || '', completedTopics: '0', totalTopics: '10', score: '', accuracy: '' });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setForm({
      category: rec.category,
      completedTopics: rec.completedTopics,
      totalTopics: rec.totalTopics,
      score: rec.score,
      accuracy: rec.accuracy,
    });
    setEditing(rec);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { toast.error('Category is required'); return; }
    if (form.score < 0 || form.score > 100) { toast.error('Score must be between 0 and 100'); return; }
    if (form.accuracy < 0 || form.accuracy > 100) { toast.error('Accuracy must be between 0 and 100'); return; }

    const payload = {
      category: form.category,
      completedTopics: Number(form.completedTopics) || 0,
      totalTopics: Number(form.totalTopics) || 10,
      score: Number(form.score) || 0,
      accuracy: Number(form.accuracy) || 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await aptitudeService.update(editing._id, payload);
        toast.success('Aptitude progress updated!');
      } else {
        await aptitudeService.create(payload);
        toast.success('Category added!');
      }
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await aptitudeService.delete(id);
      toast.success('Category removed');
      fetchRecords();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
    : 0;
  const avgAccuracy = records.length
    ? Math.round(records.reduce((s, r) => s + r.accuracy, 0) / records.length)
    : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-gradient-to-br from-primary-900/30 to-slate-900/60 border-primary-800/30">
            <p className="text-slate-400 text-sm">Average Score</p>
            <p className="text-3xl font-bold text-primary-400 mt-1">{avgScore}%</p>
            <ProgressBar value={avgScore} max={100} color="primary" showLabel={false} height="h-1.5" />
          </div>
          <div className="card bg-gradient-to-br from-accent-900/20 to-slate-900/60 border-green-800/20">
            <p className="text-slate-400 text-sm">Average Accuracy</p>
            <p className="text-3xl font-bold text-accent-400 mt-1">{avgAccuracy}%</p>
            <ProgressBar value={avgAccuracy} max={100} color="accent" showLabel={false} height="h-1.5" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{records.length} / {CATEGORIES.length} categories tracked</p>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={openAdd}
          disabled={availableCategories.length === 0}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={ChartIcon}
          title="No aptitude categories tracked"
          description="Start tracking your aptitude preparation across all key categories."
          action={<button className="btn-primary" onClick={openAdd}>Add Your First Category</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {records.map((rec) => {
            const meta = CATEGORY_META[rec.category] || { emoji: '📌', color: 'primary', desc: '' };
            const topicPct = rec.totalTopics > 0
              ? Math.round((rec.completedTopics / rec.totalTopics) * 100)
              : 0;

            return (
              <div key={rec._id} className="card hover:border-slate-700 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {meta.emoji}
                    </div>
                    <div>
                      <h3 className="text-slate-200 font-semibold text-sm">{rec.category}</h3>
                      <p className="text-slate-500 text-xs">{meta.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-slate-500 hover:text-primary-400 transition-colors p-1"
                      onClick={() => openEdit(rec)}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      onClick={() => handleDelete(rec._id)}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2.5 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs">Topics</p>
                    <p className="text-slate-200 font-bold text-lg mt-0.5">
                      {rec.completedTopics}<span className="text-slate-500 text-xs font-normal">/{rec.totalTopics}</span>
                    </p>
                  </div>
                  <div className="text-center p-2.5 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs">Score</p>
                    <p className="text-primary-400 font-bold text-lg mt-0.5">{rec.score}%</p>
                  </div>
                  <div className="text-center p-2.5 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs">Accuracy</p>
                    <p className="text-accent-400 font-bold text-lg mt-0.5">{rec.accuracy}%</p>
                  </div>
                </div>

                {/* Topic completion progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Topics completed</span>
                    <span className="text-slate-400">{topicPct}%</span>
                  </div>
                  <ProgressBar value={topicPct} max={100} color={meta.color} showLabel={false} height="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Not-yet-tracked categories hint */}
      {records.length > 0 && availableCategories.length > 0 && (
        <div className="card border-dashed border-slate-700 bg-slate-900/50">
          <p className="text-slate-500 text-sm text-center">
            {availableCategories.length} more categor{availableCategories.length === 1 ? 'y' : 'ies'} to track:{' '}
            <span className="text-slate-400">{availableCategories.join(', ')}</span>
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Update Progress' : 'Add Category'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing ? (
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {availableCategories.map((c) => (
                    <option key={c} value={c} className="bg-slate-800">{CATEGORY_META[c]?.emoji} {c}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                <span className="text-xl">{CATEGORY_META[editing.category]?.emoji}</span>
                <span className="text-slate-200 font-medium">{editing.category}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Completed Topics</label>
                <input
                  type="number" min="0" className="input-field" placeholder="e.g. 6"
                  value={form.completedTopics}
                  onChange={(e) => setForm({ ...form, completedTopics: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Total Topics</label>
                <input
                  type="number" min="1" className="input-field" placeholder="e.g. 10"
                  value={form.totalTopics}
                  onChange={(e) => setForm({ ...form, totalTopics: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Score (%)</label>
                <input
                  type="number" min="0" max="100" className="input-field" placeholder="0–100"
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Accuracy (%)</label>
                <input
                  type="number" min="0" max="100" className="input-field" placeholder="0–100"
                  value={form.accuracy}
                  onChange={(e) => setForm({ ...form, accuracy: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AptitudePage;
