import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun, Home } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { theme, setTheme } = useSettings();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="layout">
      <div className="animated-background"></div>
      <main className="main-content">
        <header className="topbar glass-panel fade-in">
          <div className="topbar-left">
            <Link to="/" className="app-title-link">
              <h2>Mini Games</h2>
            </Link>
          </div>
          <div className="topbar-right">
            <button onClick={() => navigate('/')} className="icon-btn" aria-label="Home">
              <Home size={20} />
            </button>
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => navigate('/settings')} className="icon-btn" aria-label="Settings">
              <Settings size={20} />
            </button>
            <a 
              href="https://github.com/Jed556/MiniGames" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="icon-btn github-link"
              aria-label="GitHub Repository"
            >
              <svg width="24" height="24">
                <use href="/icons.svg#github-icon" />
              </svg>
              <span className="github-text">Jed556/MiniGames</span>
            </a>
          </div>
        </header>
        <div className="content-container fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
