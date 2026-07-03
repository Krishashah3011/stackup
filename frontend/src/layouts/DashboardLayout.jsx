import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ThemeToggle from '../components/common/ThemeToggle';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tracker':   'Placement Tracker',
  '/dsa':       'DSA Tracker',
  '/aptitude':  'Aptitude Tracker',
  '/interview': 'AI Interview Prep',
  '/resume':    'AI Resume Analyzer',
  '/profile':   'My Profile',
};

const PAGE_ICONS = {
  '/dashboard': '🏠',
  '/tracker':   '📋',
  '/dsa':       '💻',
  '/aptitude':  '📊',
  '/interview': '🤖',
  '/resume':    '📄',
  '/profile':   '👤',
};

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const { user }  = useAuth();
  const pageTitle = PAGE_TITLES[location.pathname] || 'StackUp AI';
  const pageIcon  = PAGE_ICONS[location.pathname] || '⚡';

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'SU';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 px-4 lg:px-8 py-3.5 flex items-center gap-4"
          style={{
            background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-3)' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{pageIcon}</span>
            <h1 className="font-bold text-base" style={{ color: 'var(--text)' }}>{pageTitle}</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* AI badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                color: 'var(--primary)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
              AI Powered
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Profile avatar */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold transition-all hover:scale-105 hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}
              title="My Profile"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer
          className="px-8 py-3 text-center text-xs"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
        >
          StackUp AI © {new Date().getFullYear()} — Stack your skills. Track your growth. Land your dream job.
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;