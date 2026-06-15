import { useState, useEffect } from 'react';
import ROICalcProposta from './components/ROICalcProposta';

const App = () => {
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>
        <ROICalcProposta />
      </main>

      <button
        onClick={() => setDark(d => !d)}
        title={dark ? 'Modo claro' : 'Modo escuro'}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 999,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {dark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2"  x2="12" y2="4"  />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"  />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="2"  y1="12" x2="4"  y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default App;
