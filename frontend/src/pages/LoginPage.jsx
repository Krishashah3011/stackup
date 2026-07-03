import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email)                         e.email    = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left decorative panel – hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, var(--primary) 0%, var(--accent) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/30"
              style={{
                width:  `${180 + i * 80}px`,
                height: `${180 + i * 80}px`,
                top:  '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="text-white font-black text-xl tracking-tight">StackUp AI</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Your placement<br/>journey starts here.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Stack your skills, track your growth,<br/>and land your dream job.
          </p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[['126+', 'Tests Passing'], ['9', 'Phases Built'], ['6', 'AI Modules']].map(([n, l]) => (
            <div key={l}>
              <p className="text-white font-black text-2xl">{n}</p>
              <p className="text-white/60 text-xs">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="font-black text-sm" style={{ color: 'var(--text)' }}>StackUp AI</span>
          </div>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-black mb-1.5" style={{ color: 'var(--text)' }}>Welcome back 👋</h1>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sign in to your StackUp AI account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className={`input-field ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className={`input-field ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.password}</p>}
              </div>

              <button type="submit" className="btn-primary w-full btn-lg mt-2" disabled={loading}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in…</>
                  : 'Sign in →'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--text-3)' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;