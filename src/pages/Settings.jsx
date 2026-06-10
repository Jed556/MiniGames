import React, { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const {
    colorPalette, setColorPalette,
    qaHints, setQaHints,
    autoAdjustHints, setAutoAdjustHints,
    showHintButton, setShowHintButton,
    qaQuestions, setQaQuestions,
    qaTimer, setQaTimer,
    randomizeQuestions, setRandomizeQuestions,
    qaQuestionLimit, setQaQuestionLimit,
    gridSize, setGridSize,
    useSeed, setUseSeed,
    mapSeed, setMapSeed,
    showNewMapButton, setShowNewMapButton,
    resetToDefaults, resetQuestions
  } = useSettings();

  const [activeSection, setActiveSection] = useState('global');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.5 }
    );

    const sections = document.querySelectorAll('section.settings-group');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportQA = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(qaQuestions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "qa-questions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileChange = (event, mode) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed) && parsed.every(item => item.q && item.a)) {
          const formatted = parsed.map(item => ({ q: item.q, a: item.a.toUpperCase() }));
          if (mode === 'import') {
            setQaQuestions(formatted);
          } else if (mode === 'add') {
            setQaQuestions(prev => {
              const prevArray = Array.isArray(prev) ? prev : [];
              return [...prevArray, ...formatted];
            });
          }
          alert(`Successfully ${mode === 'import' ? 'imported' : 'added'} questions!`);
        } else {
          alert('Invalid JSON format. Expected an array of objects with "q" and "a" properties.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  return (
    <div className="settings-page fade-in">
      <div className="settings-sidebar glass-panel">
        <h3>Settings</h3>
        <ul>
          <li className={activeSection === 'global' ? 'active' : ''} onClick={() => scrollToSection('global')}>Global</li>
          <li className={activeSection === 'qa' ? 'active' : ''} onClick={() => scrollToSection('qa')}>Q&A Game</li>
          <li className={activeSection === 'codelab' ? 'active' : ''} onClick={() => scrollToSection('codelab')}>Code Lab Game</li>
        </ul>
      </div>

      <div className="settings-content glass-panel">
        {/* Global Settings */}
        <section id="global" className="settings-group">
          <h2>Global</h2>
          <div className="setting-row">
            <label>Color Palette</label>
            <select value={colorPalette} onChange={(e) => setColorPalette(e.target.value)} className="tech-input">
              <option value="default">Default Blue</option>
              <option value="cyberpunk">Cyberpunk Fuchsia</option>
              <option value="neon-green">Neon Green</option>
              <option value="hacker">Hacker Terminal</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Reset All Settings</label>
            <button className="tech-btn" onClick={resetToDefaults} style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }}>
              Reset to Defaults
            </button>
          </div>
        </section>

        {/* Q&A Settings */}
        <section id="qa" className="settings-group">
          <h2>Q&A Game</h2>
          <div className="setting-row">
            <label>Max Hints</label>
            <input
              type="number"
              min="0" max="10"
              value={qaHints}
              onChange={(e) => setQaHints(Number(e.target.value))}
              className="tech-input"
            />
          </div>
          <div className="setting-row">
            <label>Auto-adjust hints based on answer length</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoAdjustHints}
                onChange={(e) => setAutoAdjustHints(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-row">
            <label>Show Hint Button</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showHintButton}
                onChange={(e) => setShowHintButton(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-row">
            <label>Timer (Seconds, 0 for infinite)</label>
            <input
              type="number"
              min="0" max="300"
              value={qaTimer}
              onChange={(e) => setQaTimer(Number(e.target.value))}
              className="tech-input"
            />
          </div>
          <div className="setting-row">
            <label>Randomize Questions</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-row">
            <label>Question Limit (0 for all)</label>
            <input
              type="number"
              min="0"
              value={qaQuestionLimit}
              onChange={(e) => setQaQuestionLimit(Number(e.target.value))}
              className="tech-input"
            />
          </div>
          <div className="setting-row">
            <label>Custom Questions</label>
            <div className="button-group" style={{ display: 'flex', gap: '10px' }}>
              <button className="tech-btn" onClick={handleExportQA}>Export</button>

              <label className="tech-btn" style={{ cursor: 'pointer', textAlign: 'center' }}>
                Import
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'import')}
                />
              </label>

              <label className="tech-btn" style={{ cursor: 'pointer', textAlign: 'center' }}>
                Add
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'add')}
                />
              </label>
              <button className="tech-btn" onClick={resetQuestions} style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }}>
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Code Lab Settings */}
        <section id="codelab" className="settings-group">
          <h2>Code Lab Game</h2>
          <div className="setting-row">
            <label>Grid Size (NxN)</label>
            <input
              type="number"
              min="4" max="12"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="tech-input"
            />
          </div>
          <div className="setting-row">
            <label>Allow Custom Map Seed Input</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={useSeed}
                onChange={(e) => setUseSeed(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-row">
            <label>Show New Map Button in Playroom</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showNewMapButton}
                onChange={(e) => setShowNewMapButton(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

        </section>
      </div>
    </div>
  );
};

export default Settings;
