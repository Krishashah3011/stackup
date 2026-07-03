import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name    = 'Name is required';
    else if (form.name.trim().length<2) e.name    = 'Minimum 2 characters';
    if (!form.email)                    e.email   = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)                 e.password = 'Password is required';
    else if (form.password.length<6)   e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
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

  const Field = ({ id, label, type='text', placeholder, autoComplete }) => (
    <div>
      <label className="label">{label}</label>
      <input
        id={id} type={type}
        className={`input-field ${errors[id] ? 'error' : ''}`}
        placeholder={placeholder}
        value={form[id]}
        onChange={e => setForm({ ...form, [id]: e.target.value })}
        autoComplete={autoComplete}
      />
      {errors[id] && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span className="font-black text-sm" style={{ color: 'var(--text)' }}>StackUp AI</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-7">
            <h1 className="text-2xl font-black mb-1.5" style={{ color: 'var(--text)' }}>Create your account 🚀</h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Start your placement journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field id="name"            label="Full name"         placeholder="Rahul Sharma" autoComplete="name"         />
            <Field id="email"           label="Email address"     type="email" placeholder="rahul@example.com" autoComplete="email" />
            <Field id="password"        label="Password"          type="password" placeholder="Min. 6 characters" autoComplete="new-password" />
            <Field id="confirmPassword" label="Confirm password"  type="password" placeholder="Repeat your password" autoComplete="new-password" />

            <button type="submit" className="btn-primary w-full btn-lg mt-2" disabled={loading}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating account…</>
                : 'Create account →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-3)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;