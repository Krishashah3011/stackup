import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              style: {
                background: '#F0FDF4',
                color: '#166534',
                border: '1px solid #BBF7D0',
              },
              iconTheme: { primary: '#16A34A', secondary: '#DCFCE7' },
            },
            error: {
              style: {
                background: '#FFF1F2',
                color: '#9F1239',
                border: '1px solid #FECDD3',
              },
              iconTheme: { primary: '#E11D48', secondary: '#FFE4E6' },
            },
            className: 'dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700',
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);