import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import toast from 'react-hot-toast';

// ── Defined OUTSIDE the page component so React never remounts it ─────────────
const FloatField = ({ id, label, type = 'text', value, onChange, error, autoComplete }) => (
  <div>
  <>
  <label className="label">{label}</label>

  <input
    id={id}
    type={type}
    className={`input-field ${error ? 'error' : ''}`}
    value={value}
    onChange={onChange}
    autoComplete={autoComplete}
  />
  </>
    {error && (
      <p className="text-xs mt-1.5 ml-1" style={{ color: 'var(--danger)' }}>{error}</p>
    )}
  </div>
);

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Stable per-field setter — does NOT redefine a new component each render
  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                       e.name            = 'Name is required';
    else if (form.name.trim().length < 2)        e.name            = 'Minimum 2 characters';
    if (!form.email)                             e.email           = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email          = 'Enter a valid email';
    if (!form.password)                          e.password        = 'Password is required';
    else if (form.password.length < 6)           e.password        = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword)  e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span className="font-black text-sm" style={{ color: 'var(--text)' }}>StackUp AI</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-7">
            <h1 className="text-2xl font-black mb-1.5" style={{ color: 'var(--text)' }}>
              Create your account 🚀
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Start your placement journey today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FloatField
              id="name"
              label="Full name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              autoComplete="name"
            />
            <FloatField
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              autoComplete="email"
            />
            <FloatField
              id="password"
              label="Password (min. 6 characters)"
              type="password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              autoComplete="new-password"
            />
            <FloatField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <button type="submit" className="btn-primary w-full btn-lg mt-2" disabled={loading}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account →'
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-3)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;