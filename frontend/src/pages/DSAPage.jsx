import { useState, useEffect, useCallback } from 'react';
import { dsaService } from '../../services/api';
import ProgressBar from '../../components/common/ProgressBar';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const TOPICS = ['Arrays', 'Strings', 'Linked List', 'Stack & Queue', 'Hashing', 'Trees', 'Graphs', 'Dynamic Programming'];

const TOPIC_META = {
  Arrays:               { color: 'primary', emoji: '📋' },
  Strings:              { color: 'accent',  emoji: '🔤' },
  'Linked List':        { color: 'purple',  emoji: '🔗' },
  'Stack & Queue':      { color: 'yellow',  emoji: '📚' },
  Hashing:              { color: 'green',   emoji: '#️⃣' },
  Trees:                { color: 'accent',  emoji: '🌳' },
  Graphs:               { color: 'red',     emoji: '🕸️'  },
  'Dynamic Programming':{ color: 'purple',  emoji: '⚡' },
};

const CodeIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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

const DSAPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ topic: '', totalProblems: '', solvedProblems: '' });

  const availableTopics = TOPICS.filter((t) => !records.find((r) => r.topic === t));

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await dsaService.getAll();
      setRecords(data.data);
    } catch {
      toast.error('Failed to load DSA progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const openAdd = () => {
    setForm({ topic: availableTopics[0] || '', totalProblems: '', solvedProblems: '0' });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setForm({ topic: rec.topic, totalProblems: rec.totalProblems, solvedProblems: rec.solvedProblems });
    setEditing(rec);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topic || !form.totalProblems) { toast.error('Topic and total problems are required'); return; }
    if (Number(form.solvedProblems) > Number(form.totalProblems)) { toast.error('Solved cannot exceed total'); return; }

    setSaving(true);
    try {
      if (editing) {
        await dsaService.update(editing._id, { totalProblems: Number(form.totalProblems), solvedProblems: Number(form.solvedProblems) });
        toast.success('Progress updated!');
      } else {
        await dsaService.create({ topic: form.topic, totalProblems: Number(form.totalProblems), solvedProblems: Number(form.solvedProblems) });
        toast.success('Topic added!');
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
      await dsaService.delete(id);
      toast.success('Topic removed');
      fetchRecords();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const overallProgress = records.length
    ? Math.round(records.reduce((s, r) => s + r.progress, 0) / records.length)
    : 0;

  const totalSolved = records.reduce((s, r) => s + r.solvedProblems, 0);
  const totalProblems = records.reduce((s, r) => s + r.totalProblems, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary bar */}
      {records.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-900/30 to-slate-900/60 border-primary-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm">Overall DSA Progress</p>
              <p className="text-3xl font-bold text-primary-400 mt-1">{overallProgress}%</p>
              <p className="text-slate-500 text-xs mt-1">{totalSolved} / {totalProblems} problems solved</p>
            </div>
            <div className="sm:w-48">
              <ProgressBar value={overallProgress} max={100} color="primary" showLabel={false} height="h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{records.length} topic{records.length !== 1 ? 's' : ''} tracked</p>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={openAdd}
          disabled={availableTopics.length === 0}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Topic
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={CodeIcon}
          title="No DSA topics tracked"
          description="Start tracking your DSA problem-solving progress by topic."
          action={<button className="btn-primary" onClick={openAdd}>Add Your First Topic</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {records.map((rec) => {
            const meta = TOPIC_META[rec.topic] || { color: 'primary', emoji: '📌' };
            return (
              <div key={rec._id} className="card hover:border-slate-700 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <h3 className="text-slate-200 font-medium text-sm leading-tight">{rec.topic}</h3>
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

                <div className="space-y-2">
                  <ProgressBar value={rec.progress} max={100} color={meta.color} showLabel={false} height="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{rec.solvedProblems} solved</span>
                    <span className="text-slate-500">{rec.totalProblems} total</span>
                  </div>
                </div>

                <div className={`mt-3 text-center py-1.5 rounded-lg bg-${meta.color === 'accent' ? 'green' : meta.color}-500/10`}>
                  <span className={`text-2xl font-bold text-${meta.color === 'accent' ? 'green' : meta.color}-400`}>
                    {rec.progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Update Progress' : 'Add DSA Topic'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div>
                <label className="label">Topic</label>
                <select className="input-field" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                  {availableTopics.map((t) => (
                    <option key={t} value={t} className="bg-slate-800">{TOPIC_META[t]?.emoji} {t}</option>
                  ))}
                </select>
              </div>
            )}
            {editing && (
              <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                <span className="text-xl">{TOPIC_META[editing.topic]?.emoji}</span>
                <span className="text-slate-200 font-medium">{editing.topic}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Problems</label>
                <input
                  type="number" min="1" className="input-field"
                  placeholder="e.g. 50"
                  value={form.totalProblems}
                  onChange={(e) => setForm({ ...form, totalProblems: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Solved So Far</label>
                <input
                  type="number" min="0" className="input-field"
                  placeholder="e.g. 20"
                  value={form.solvedProblems}
                  onChange={(e) => setForm({ ...form, solvedProblems: e.target.value })}
                />
              </div>
            </div>

            {form.totalProblems && form.solvedProblems && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <ProgressBar
                  value={Number(form.solvedProblems)}
                  max={Number(form.totalProblems)}
                  color="primary"
                  height="h-2"
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Topic'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DSAPage;
