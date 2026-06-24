import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ title, subtitle, children }) => (
  <div className="card">
    <div className="mb-5 pb-4 border-b border-slate-800">
      <h2 className="text-slate-200 font-semibold">{title}</h2>
      {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Field = ({ label, id, type = 'text', value, onChange, placeholder, hint, error, autoComplete }) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <input
      id={id}
      type={type}
      className={`input-field ${error ? 'border-red-500/70 focus:ring-red-500' : ''}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
    {hint  && !error && <p className="text-slate-600 text-xs mt-1.5">{hint}</p>}
    {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();

  // ── Name form ──────────────────────────────────────────────────────────────
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [nameErrors, setNameErrors] = useState({});
  const [nameSaving, setNameSaving] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  // ── Delete account ────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Initials avatar ───────────────────────────────────────────────────────
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SU';

  // ── Formatted join date ───────────────────────────────────────────────────
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  // ── Handle name update ────────────────────────────────────────────────────
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!nameForm.name.trim()) errs.name = 'Name is required';
    else if (nameForm.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    else if (nameForm.name.trim().length > 50) errs.name = 'Name cannot exceed 50 characters';

    setNameErrors(errs);
    if (Object.keys(errs).length) return;

    if (nameForm.name.trim() === user?.name) {
      toast('No changes to save.', { icon: 'ℹ️' });
      return;
    }

    setNameSaving(true);
    try {
      await updateProfile({ name: nameForm.name.trim() });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  };

  // ── Handle password update ────────────────────────────────────────────────
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!pwForm.newPassword) errs.newPassword = 'New password is required';
    else if (pwForm.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (pwForm.newPassword && pwForm.newPassword !== pwForm.confirmNewPassword) {
      errs.confirmNewPassword = 'Passwords do not match';
    }

    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwSaving(true);
    try {
      await updateProfile({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      if (msg.toLowerCase().includes('current')) {
        setPwErrors({ currentPassword: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setPwSaving(false);
    }
  };

  // ── Handle account deletion ───────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Password is required'); return; }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete account';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">

      {/* Profile header card */}
      <div className="card bg-gradient-to-br from-primary-900/30 to-slate-900/60 border-primary-800/30">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg glow-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user?.name}</h1>
            <p className="text-slate-400 text-sm truncate">{user?.email}</p>
            <p className="text-slate-600 text-xs mt-1">Member since {joinDate}</p>
          </div>
          <button
            className="btn-secondary text-sm flex-shrink-0 hidden sm:flex items-center gap-2"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Update name */}
      <SectionCard title="Personal Information" subtitle="Update your display name">
        <form onSubmit={handleNameUpdate} className="space-y-4" noValidate>
          <Field
            label="Full name"
            id="name"
            value={nameForm.name}
            onChange={(e) => setNameForm({ name: e.target.value })}
            placeholder="Your full name"
            error={nameErrors.name}
            autoComplete="name"
          />
          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              className="input-field opacity-50 cursor-not-allowed"
              value={user?.email || ''}
              disabled
              title="Email cannot be changed"
            />
            <p className="text-slate-600 text-xs mt-1.5">Email address cannot be changed</p>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" className="btn-primary" disabled={nameSaving}>
              {nameSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save changes'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Change password */}
      <SectionCard title="Change Password" subtitle="Use a strong password of at least 6 characters">
        <form onSubmit={handlePasswordUpdate} className="space-y-4" noValidate>
          <Field
            label="Current password"
            id="currentPassword"
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            placeholder="••••••••"
            error={pwErrors.currentPassword}
            autoComplete="current-password"
          />
          <Field
            label="New password"
            id="newPassword"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            placeholder="Min. 6 characters"
            error={pwErrors.newPassword}
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            id="confirmNewPassword"
            type="password"
            value={pwForm.confirmNewPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmNewPassword: e.target.value })}
            placeholder="Repeat new password"
            error={pwErrors.confirmNewPassword}
            autoComplete="new-password"
          />
          <div className="flex justify-end pt-1">
            <button type="submit" className="btn-primary" disabled={pwSaving}>
              {pwSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : 'Update password'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone" subtitle="Irreversible and destructive actions">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
          <div>
            <p className="text-red-400 font-medium text-sm">Delete account</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Permanently removes your account and all data. This cannot be undone.
            </p>
          </div>
          <button
            className="btn-danger flex-shrink-0"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete account
          </button>
        </div>
      </SectionCard>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 animate-slide-up">
            {/* Icon */}
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-slate-100 font-bold text-lg mb-1">Delete your account?</h3>
            <p className="text-slate-400 text-sm mb-5">
              This will permanently delete your account and erase all your applications, DSA progress, aptitude data, and AI analyses. This action <strong className="text-white">cannot be undone</strong>.
            </p>

            <div className="mb-5">
              <label className="label">Confirm your password</label>
              <input
                type="password"
                className={`input-field ${deleteError ? 'border-red-500/70 focus:ring-red-500' : ''}`}
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                autoComplete="current-password"
              />
              {deleteError && <p className="text-red-400 text-xs mt-1.5">{deleteError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : 'Yes, delete my account'}
              </button>
              <button
                className="btn-secondary flex-1"
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;