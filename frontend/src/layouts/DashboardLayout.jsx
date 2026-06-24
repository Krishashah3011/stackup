import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tracker':   'Placement Tracker',
  '/dsa':       'DSA Tracker',
  '/aptitude':  'Aptitude Tracker',
  '/interview': 'AI Interview Prep',
  '/resume':    'AI Resume Analyzer',
  '/profile':   'My Profile',
};

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const { user }  = useAuth();
  const pageTitle = PAGE_TITLES[location.pathname] || 'StackUp AI';

  // Avatar initials
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SU';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-4 flex items-center gap-4">

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden text-slate-400 hover:text-slate-100 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title */}
          <h1 className="text-slate-100 font-semibold text-lg flex-1">{pageTitle}</h1>

          {/* Right: AI badge + profile avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-primary-600/10 border border-primary-500/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
              <span className="text-primary-400 text-xs font-medium">AI Powered</span>
            </div>

            {/* Profile link avatar */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-primary-400 hover:ring-offset-2 hover:ring-offset-slate-950 transition-all"
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
      </div>
    </div>
  );
};

export default DashboardLayout;