import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SectionCard = ({ title, subtitle, children }) => (
  <div className="card space-y-5">
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '0' }}>
      <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Field = ({ label, id, type='text', value, onChange, placeholder, hint, error, autoComplete, disabled }) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <input id={id} type={type} className={`input-field ${error ? 'error' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled} />
    {hint  && !error && <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    {error && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{error}</p>}
  </div>
);

const ProfilePage = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'SU';
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—';

  const [nameForm, setNameForm]   = useState({ name: user?.name || '' });
  const [nameErrors, setNameErrors] = useState({});
  const [nameSaving, setNameSaving] = useState(false);

  const [pwForm, setPwForm]   = useState({ currentPassword:'', newPassword:'', confirmNewPassword:'' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw]     = useState('');
  const [deleteErr, setDeleteErr]   = useState('');
  const [deleting, setDeleting]     = useState(false);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!nameForm.name.trim()) errs.name = 'Name is required';
    else if (nameForm.name.trim().length<2) errs.name = 'Minimum 2 characters';
    setNameErrors(errs);
    if (Object.keys(errs).length) return;
    if (nameForm.name.trim() === user?.name) { toast('No changes to save.', {icon:'ℹ️'}); return; }
    setNameSaving(true);
    try { await updateProfile({ name: nameForm.name.trim() }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to update name'); }
    finally { setNameSaving(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!pwForm.newPassword) errs.newPassword = 'New password is required';
    else if (pwForm.newPassword.length<6) errs.newPassword = 'Minimum 6 characters';
    if (pwForm.newPassword && pwForm.newPassword !== pwForm.confirmNewPassword) errs.confirmNewPassword = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPwSaving(true);
    try {
      await updateProfile({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword:'', newPassword:'', confirmNewPassword:'' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      if (msg.toLowerCase().includes('current')) setPwErrors({ currentPassword: msg });
      else toast.error(msg);
    } finally { setPwSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePw) { setDeleteErr('Password is required'); return; }
    setDeleting(true); setDeleteErr('');
    try { await deleteAccount(deletePw); navigate('/login', { replace: true }); }
    catch (err) { setDeleteErr(err.response?.data?.message || 'Failed to delete account'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="card overflow-hidden relative" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--surface)), var(--surface))' }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ background: 'var(--primary)' }} />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: 'var(--text)' }}>{user?.name}</h1>
            <p className="text-sm truncate" style={{ color: 'var(--text-3)' }}>{user?.email}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Member since {joinDate}</p>
          </div>
          <button className="btn-secondary btn-sm hidden sm:flex" onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Name */}
      <SectionCard title="Personal Information" subtitle="Update your display name">
        <form onSubmit={handleNameUpdate} className="space-y-4" noValidate>
          <Field label="Full name" id="name" value={nameForm.name} onChange={e=>setNameForm({name:e.target.value})} placeholder="Your full name" error={nameErrors.name} autoComplete="name" />
          <Field label="Email address" id="email-display" value={user?.email||''} disabled hint="Email cannot be changed" />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={nameSaving}>
              {nameSaving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving…</> : 'Save changes'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Password */}
      <SectionCard title="Change Password" subtitle="Use a strong password of at least 6 characters">
        <form onSubmit={handlePasswordUpdate} className="space-y-4" noValidate>
          <Field label="Current password" id="currentPassword" type="password" value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} placeholder="••••••••" error={pwErrors.currentPassword} autoComplete="current-password" />
          <Field label="New password" id="newPassword" type="password" value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} placeholder="Min. 6 characters" error={pwErrors.newPassword} autoComplete="new-password" />
          <Field label="Confirm new password" id="confirmNewPassword" type="password" value={pwForm.confirmNewPassword} onChange={e=>setPwForm({...pwForm,confirmNewPassword:e.target.value})} placeholder="Repeat new password" error={pwErrors.confirmNewPassword} autoComplete="new-password" />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={pwSaving}>
              {pwSaving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Updating…</> : 'Update password'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Danger */}
      <SectionCard title="Danger Zone" subtitle="Irreversible and destructive actions">
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--danger) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Delete account</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Permanently removes your account and all data.</p>
          </div>
          <button className="btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete account</button>
        </div>
      </SectionCard>

      {/* Delete modal */}
      {showDelete && (
        <div className="modal-overlay">
          <div className="modal-panel animate-scale-in max-w-md">
            <div className="modal-header">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Delete your account?</h3>
              <button onClick={() => { setShowDelete(false); setDeletePw(''); setDeleteErr(''); }} style={{ color: 'var(--text-3)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                This will permanently delete your account and all associated data. This action <strong style={{ color: 'var(--text)' }}>cannot be undone</strong>.
              </p>
              <div>
                <label className="label">Confirm your password</label>
                <input type="password" className={`input-field ${deleteErr ? 'error' : ''}`} placeholder="Enter your password to confirm"
                  value={deletePw} onChange={e => { setDeletePw(e.target.value); setDeleteErr(''); }} autoComplete="current-password" />
                {deleteErr && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{deleteErr}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 btn py-2.5 text-white font-semibold rounded-xl"
                  style={{ background: 'var(--danger)' }}
                  onClick={handleDeleteAccount} disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => { setShowDelete(false); setDeletePw(''); setDeleteErr(''); }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;