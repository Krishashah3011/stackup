import { useState, useEffect, useCallback, useRef } from 'react';
import { applicationService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['Applied', 'OA Scheduled', 'OA Cleared', 'Interview Scheduled', 'Selected', 'Rejected'];
const ALL_FILTERS = ['All', ...STATUSES];

const STATUS_PIPELINE = [
  { key: 'Applied',              label: 'Applied',       color: 'blue',   icon: '📤' },
  { key: 'OA Scheduled',         label: 'OA',            color: 'yellow', icon: '📝' },
  { key: 'OA Cleared',           label: 'OA Cleared',    color: 'amber',  icon: '✅' },
  { key: 'Interview Scheduled',  label: 'Interview',     color: 'purple', icon: '🎤' },
  { key: 'Selected',             label: 'Selected',      color: 'green',  icon: '🏆' },
  { key: 'Rejected',             label: 'Rejected',      color: 'red',    icon: '❌' },
];

const PIPELINE_STYLES = {
  blue:   { bar: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  amber:  { bar: 'bg-amber-500',  text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  purple: { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  green:  { bar: 'bg-green-500',  text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  red:    { bar: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
};

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'appliedDate', label: 'Applied Date' },
  { value: 'company', label: 'Company' },
  { value: 'status', label: 'Status' },
];

const EMPTY_FORM = {
  company: '', role: '', package: '', status: 'Applied',
  appliedDate: new Date().toISOString().split('T')[0], notes: '',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const BriefcaseIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const SortIcon = ({ asc }) => (
  <svg className="w-3.5 h-3.5 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d={asc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, size = 'lg' }) => {
  const maxW = size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-slate-900 border border-slate-700 rounded-xl w-full ${maxW} shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}>
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
};

// ─── Application Form ─────────────────────────────────────────────────────────
const ApplicationForm = ({ initial = EMPTY_FORM, onSubmit, onCancel, loading }) => {
  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.company.trim())        e.company = 'Company name is required';
    else if (form.company.length > 100) e.company = 'Max 100 characters';
    if (!form.role.trim())           e.role = 'Role is required';
    else if (form.role.length > 100) e.role = 'Max 100 characters';
    if (form.notes.length > 500)     e.notes = `${form.notes.length}/500 — too long`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Company *</label>
          <input
            className={`input-field ${errors.company ? 'border-red-500/70' : ''}`}
            placeholder="Google, Infosys, TCS…"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
          />
          {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
        </div>
        <div>
          <label className="label">Role *</label>
          <input
            className={`input-field ${errors.role ? 'border-red-500/70' : ''}`}
            placeholder="Software Engineer"
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
          />
          {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Package (CTC)</label>
          <input
            className="input-field"
            placeholder="₹12 LPA"
            value={form.package}
            onChange={(e) => set('package', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-slate-800">{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Applied Date</label>
        <input
          type="date"
          className="input-field"
          value={form.appliedDate}
          onChange={(e) => set('appliedDate', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="label mb-0">Notes</label>
          <span className={`text-xs ${form.notes.length > 450 ? 'text-yellow-400' : 'text-slate-600'}`}>
            {form.notes.length}/500
          </span>
        </div>
        <textarea
          className={`input-field resize-none ${errors.notes ? 'border-red-500/70' : ''}`}
          rows={3}
          placeholder="Interview date, HR name, referral info…"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          maxLength={500}
        />
        {errors.notes && <p className="text-red-400 text-xs mt-1">{errors.notes}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span>
            : 'Save application'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────
const DetailDrawer = ({ app, onClose, onEdit, onDelete, onStatusChange, updatingStatus }) => {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const daysSince  = (d) => {
    if (!d) return null;
    const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Drawer panel */}
      <div
        className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-white truncate">{app.company}</h2>
            <p className="text-slate-400 text-sm mt-0.5 truncate">{app.role}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-1">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-6">
          {/* Current status */}
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Current Status</p>
            <StatusBadge status={app.status} />
          </div>

          {/* Quick status update */}
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Update Status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => {
                const isActive = app.status === s;
                return (
                  <button
                    key={s}
                    disabled={isActive || updatingStatus}
                    onClick={() => onStatusChange(app._id, s)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-primary-600/20 border-primary-500/50 text-primary-400 cursor-default'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {updatingStatus === s
                      ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Updating…</span>
                      : s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-500 text-xs">Package</p>
                <p className="text-slate-200 font-medium text-sm mt-0.5">{app.package || 'Not disclosed'}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-500 text-xs">Applied</p>
                <p className="text-slate-200 font-medium text-sm mt-0.5">{daysSince(app.appliedDate)}</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-500 text-xs">Applied Date</p>
              <p className="text-slate-200 text-sm mt-0.5">{formatDate(app.appliedDate)}</p>
            </div>
            {app.notes && (
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Notes</p>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{app.notes}</p>
              </div>
            )}
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-500 text-xs">Added</p>
              <p className="text-slate-400 text-sm mt-0.5">{formatDate(app.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 p-6 border-t border-slate-800 flex-shrink-0">
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
            onClick={() => onEdit(app)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            className="btn-danger flex items-center gap-2 text-sm"
            onClick={() => onDelete(app)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pipeline strip ───────────────────────────────────────────────────────────
const PipelineStrip = ({ counts, total, onFilterClick, activeFilter }) => (
  <div className="card p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-slate-400 text-sm font-medium">Application Pipeline</p>
      <span className="text-xs text-slate-500">{total} total</span>
    </div>
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {STATUS_PIPELINE.map((stage) => {
        const styles = PIPELINE_STYLES[stage.color];
        const count  = counts[stage.key] || 0;
        const pct    = total > 0 ? Math.round((count / total) * 100) : 0;
        const isActive = activeFilter === stage.key;
        return (
          <button
            key={stage.key}
            onClick={() => onFilterClick(isActive ? 'All' : stage.key)}
            className={`flex flex-col items-center p-2.5 rounded-lg border transition-all duration-150 text-center ${
              isActive
                ? `${styles.bg} ${styles.border}`
                : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <span className="text-base mb-1">{stage.icon}</span>
            <span className={`text-xl font-bold ${isActive ? styles.text : 'text-slate-200'}`}>{count}</span>
            <span className="text-slate-500 text-[10px] leading-tight mt-0.5">{stage.label}</span>
            {total > 0 && (
              <span className={`text-[10px] mt-1 ${isActive ? styles.text : 'text-slate-600'}`}>{pct}%</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const TrackerPage = () => {
  const [applications, setApplications]   = useState([]);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [filter, setFilter]               = useState('All');
  const [search, setSearch]               = useState('');
  const [sort, setSort]                   = useState('createdAt');
  const [order, setOrder]                 = useState('desc');
  const [showModal, setShowModal]         = useState(false);
  const [editing, setEditing]             = useState(null);
  const [deleting, setDeleting]           = useState(null);
  const [viewingApp, setViewingApp]       = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const searchRef  = useRef(null);
  const searchTimer = useRef(null);

  // ── Fetch applications ───────────────────────────────────────────────────
  const fetchApplications = useCallback(async (params = {}) => {
    try {
      const query = {
        sort, order,
        ...(filter !== 'All' && { status: filter }),
        ...(search.trim() && { search: search.trim() }),
        ...params,
      };
      const { data } = await applicationService.getAll(query);
      setApplications(data.data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [filter, search, sort, order]);

  // ── Fetch stats ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await applicationService.getStats();
      setStats(data.data);
    } catch {
      // Stats are non-critical — fail silently
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced refetch on filter/search/sort change
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchApplications(), 300);
    return () => clearTimeout(searchTimer.current);
  }, [fetchApplications]);

  // ── Sort toggle ──────────────────────────────────────────────────────────
  const handleSortClick = (field) => {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(field); setOrder('asc'); }
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await applicationService.create(form);
      toast.success('Application added!');
      setShowModal(false);
      await Promise.all([fetchApplications(), fetchStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add application');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await applicationService.update(editing._id, form);
      toast.success('Application updated');
      setEditing(null);
      setViewingApp(null);
      await Promise.all([fetchApplications(), fetchStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await applicationService.delete(deleting._id);
      toast.success(`${deleting.company} application removed`);
      setDeleting(null);
      setViewingApp(null);
      await Promise.all([fetchApplications(), fetchStats()]);
    } catch {
      toast.error('Failed to delete application');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatus(newStatus);
    try {
      await applicationService.update(id, { status: newStatus });
      toast.success(`Status updated to "${newStatus}"`);
      // Update in-place for instant UI feedback
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
      );
      if (viewingApp?._id === id) setViewingApp((v) => ({ ...v, status: newStatus }));
      fetchStats();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openEdit = (app) => {
    setEditing(app);
    setViewingApp(null);
  };

  const openDelete = (app) => {
    setDeleting(app);
    setViewingApp(null);
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const counts    = stats?.counts || {};
  const totalApps = counts.total || 0;

  const SortTh = ({ field, children, className = '' }) => (
    <th
      className={`text-left text-slate-400 font-medium px-5 py-3.5 cursor-pointer hover:text-slate-200 select-none transition-colors ${className}`}
      onClick={() => handleSortClick(field)}
    >
      {children}
      {sort === field && <SortIcon asc={order === 'asc'} />}
    </th>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Pipeline strip */}
      {!loading && (
        <PipelineStrip
          counts={counts}
          total={totalApps}
          onFilterClick={setFilter}
          activeFilter={filter}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            className="input-field pl-9 pr-9"
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter select */}
        <select
          className="input-field sm:w-52"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {ALL_FILTERS.map((s) => (
            <option key={s} value={s} className="bg-slate-800">
              {s}{s !== 'All' && counts[s] !== undefined ? ` (${counts[s]})` : ''}
            </option>
          ))}
        </select>

        {/* Sort select (mobile) */}
        <select
          className="input-field sm:w-44 lg:hidden"
          value={`${sort}-${order}`}
          onChange={(e) => {
            const [f, o] = e.target.value.split('-');
            setSort(f); setOrder(o);
          }}
        >
          {SORT_OPTIONS.flatMap((o) => [
            <option key={`${o.value}-desc`} value={`${o.value}-desc`} className="bg-slate-800">{o.label} ↓</option>,
            <option key={`${o.value}-asc`}  value={`${o.value}-asc`}  className="bg-slate-800">{o.label} ↑</option>,
          ])}
        </select>

        {/* Add button */}
        <button
          className="btn-primary flex items-center gap-2 flex-shrink-0"
          onClick={() => setShowModal(true)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Application</span>
        </button>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-slate-500 text-xs">
          Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
          {filter !== 'All' && ` · filtered by "${filter}"`}
          {search && ` · matching "${search}"`}
        </p>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={BriefcaseIcon}
            title={search || filter !== 'All' ? 'No matching applications' : 'No applications yet'}
            description={
              search || filter !== 'All'
                ? 'Try clearing filters or searching for something else.'
                : 'Start tracking your placement journey by adding your first application.'
            }
            action={
              <div className="flex gap-3 justify-center flex-wrap">
                <button className="btn-primary" onClick={() => setShowModal(true)}>Add Application</button>
                {(search || filter !== 'All') && (
                  <button className="btn-secondary" onClick={() => { setSearch(''); setFilter('All'); }}>
                    Clear Filters
                  </button>
                )}
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <SortTh field="company">Company</SortTh>
                  <SortTh field="role" className="hidden sm:table-cell">Role</SortTh>
                  <th className="text-left text-slate-400 font-medium px-5 py-3.5 hidden md:table-cell">Package</th>
                  <SortTh field="status">Status</SortTh>
                  <SortTh field="appliedDate" className="hidden lg:table-cell">Applied</SortTh>
                  <th className="text-right text-slate-400 font-medium px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => setViewingApp(app)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-slate-200 font-medium group-hover:text-white transition-colors">{app.company}</p>
                      <p className="text-slate-500 text-xs sm:hidden mt-0.5">{app.role}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 hidden sm:table-cell">{app.role}</td>
                    <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                      {app.package && app.package !== 'Not disclosed' ? app.package : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell text-xs">
                      {app.appliedDate
                        ? new Date(app.appliedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="text-slate-600 hover:text-primary-400 transition-colors p-1.5 rounded-lg hover:bg-primary-500/10"
                          onClick={() => openEdit(app)}
                          title="Edit application"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                          onClick={() => openDelete(app)}
                          title="Delete application"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals & Overlays ─────────────────────────────────────────────── */}

      {/* Add modal */}
      {showModal && (
        <Modal title="Add Application" onClose={() => setShowModal(false)}>
          <ApplicationForm
            onSubmit={handleCreate}
            onCancel={() => setShowModal(false)}
            loading={saving}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title="Edit Application" onClose={() => setEditing(null)}>
          <ApplicationForm
            initial={{
              company:     editing.company,
              role:        editing.role,
              package:     editing.package === 'Not disclosed' ? '' : (editing.package || ''),
              status:      editing.status,
              appliedDate: editing.appliedDate
                ? new Date(editing.appliedDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              notes: editing.notes || '',
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <Modal title="Delete Application?" onClose={() => setDeleting(null)} size="sm">
          <div className="space-y-4">
            <p className="text-slate-400 text-sm leading-relaxed">
              This will permanently remove your application to{' '}
              <span className="text-white font-semibold">{deleting.company}</span> for the role of{' '}
              <span className="text-white font-semibold">{deleting.role}</span>.
            </p>
            <p className="text-slate-600 text-xs">This action cannot be undone.</p>
            <div className="flex gap-3 pt-1">
              <button
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors text-sm"
                onClick={handleDelete}
              >
                Delete
              </button>
              <button className="btn-secondary flex-1" onClick={() => setDeleting(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail drawer */}
      {viewingApp && (
        <DetailDrawer
          app={viewingApp}
          onClose={() => setViewingApp(null)}
          onEdit={openEdit}
          onDelete={openDelete}
          onStatusChange={handleStatusChange}
          updatingStatus={updatingStatus}
        />
      )}
    </div>
  );
};

export default TrackerPage;