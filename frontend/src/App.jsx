import { NavLink, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-logo">🧠</span>
            <span>
              <span className="brand-title">Veille IA</span>
              <span className="brand-sub">arXiv · actualités · notions du jour</span>
            </span>
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>Aujourd'hui</NavLink>
            <NavLink to="/archives">Archives</NavLink>
          </nav>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="site-footer">
        Généré chaque matin par <strong>Hermes</strong> · résumés FR via OpenRouter ·{' '}
        <a href="https://github.com/TobenFreeman/veille" target="_blank" rel="noreferrer">code source</a>
      </footer>
    </div>
  );
}
