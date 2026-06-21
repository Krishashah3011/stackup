import { useState, useEffect, useCallback } from 'react';
import { applicationService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'Applied', 'OA Scheduled', 'OA Cleared', 'Interview Scheduled', 'Selected', 'Rejected'];

const EMPTY_FORM = {
  company: '', role: '', package: '', status: 'Applied',
  appliedDate: new Date().toISOString().split('T')[0], notes: '',
};

const BriefcaseIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl animate-slide-up">
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

const ApplicationForm = ({ initial = EMPTY_FORM, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      toast.error('Company and role are required');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Company *</label>
          <input className="input-field" placeholder="Google" value={form.company} onChange={(e) => set('company', e.target.value)} />
        </div>
        <div>
          <label className="label">Role *</label>
          <input className="input-field" placeholder="Software Engineer" value={form.role} onChange={(e) => set('role', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Package (CTC)</label>
          <input className="input-field" placeholder="₹12 LPA" value={form.package} onChange={(e) => set('package', e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.filter((s) => s !== 'All').map((s) => (
              <option key={s} value={s} className="bg-slate-800">{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Applied Date</label>
        <input type="date" className="input-field" value={form.appliedDate} onChange={(e) => set('appliedDate', e.target.value)} />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="Any additional notes..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save application'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const TrackerPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'All') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const { data } = await applicationService.getAll(params);
      setApplications(data.data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchApplications, 300);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await applicationService.create(form);
      toast.success('Application added!');
      setShowModal(false);
      fetchApplications();
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
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await applicationService.delete(deleting._id);
      toast.success('Application removed');
      setDeleting(null);
      fetchApplications();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const statusCounts = STATUSES.reduce((acc, s) => {
    if (s === 'All') { acc[s] = applications.length; return acc; }
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">{applications.length} application{applications.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button className="btn-primary flex items-center gap-2 self-start sm:self-auto" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Application
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input-field pl-9"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-slate-800">{s} {statusCounts[s] !== undefined ? `(${statusCounts[s]})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={BriefcaseIcon}
            title={search || filter !== 'All' ? 'No matching applications' : 'No applications yet'}
            description={search || filter !== 'All' ? 'Try adjusting your search or filter.' : 'Start by adding your first job application.'}
            action={
              <button className="btn-primary" onClick={() => setShowModal(true)}>Add Application</button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-400 font-medium px-5 py-3.5">Company</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3.5 hidden sm:table-cell">Role</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3.5 hidden md:table-cell">Package</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3.5">Status</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3.5 hidden lg:table-cell">Applied</th>
                  <th className="text-right text-slate-400 font-medium px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-slate-200 font-medium">{app.company}</p>
                      <p className="text-slate-500 text-xs sm:hidden">{app.role}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 hidden sm:table-cell">{app.role}</td>
                    <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">{app.package || '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                    <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell text-xs">
                      {new Date(app.appliedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-slate-500 hover:text-primary-400 transition-colors p-1"
                          onClick={() => setEditing(app)}
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          onClick={() => setDeleting(app)}
                          title="Delete"
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

      {/* Add Modal */}
      {showModal && (
        <Modal title="Add Application" onClose={() => setShowModal(false)}>
          <ApplicationForm onSubmit={handleCreate} onCancel={() => setShowModal(false)} loading={saving} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal title="Edit Application" onClose={() => setEditing(null)}>
          <ApplicationForm
            initial={{
              company: editing.company, role: editing.role,
              package: editing.package || '', status: editing.status,
              appliedDate: editing.appliedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
              notes: editing.notes || '',
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-slate-100 font-semibold mb-2">Remove application?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently remove your application to <span className="text-white font-medium">{deleting.company}</span>.
            </p>
            <div className="flex gap-3">
              <button className="btn-danger flex-1" onClick={handleDelete}>Remove</button>
              <button className="btn-secondary flex-1" onClick={() => setDeleting(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackerPage;
