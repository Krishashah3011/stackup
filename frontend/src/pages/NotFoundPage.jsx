import { Link } from 'react-router-dom';
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
    <div className="text-center animate-fade-in">
      <p className="text-8xl font-black text-gradient mb-4">404</p>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Page not found</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">← Back to Dashboard</Link>
    </div>
  </div>
);
export default NotFoundPage;