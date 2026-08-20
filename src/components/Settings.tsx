import { useEffect, useState } from 'react';
import { readQualityPreference, writeQualityPreference, type QualityPreference } from '../lib/quality';

export default function Settings() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark');
  const [quality, setQuality] = useState<QualityPreference>(readQualityPreference);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => writeQualityPreference(quality), [quality]);

  const clearSaved = () => {
    localStorage.clear();
    sessionStorage.clear();
    setCleared(true);
  };

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Settings</h2>
          <p>Saved in this browser only.</p>
        </div>
      </header>

      <div className="panels">
        <div className="panel">
          <h3>Appearance</h3>
          <p>Dark suits the arcade; light is easier under fluorescent lighting.</p>
          <button className="button ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </div>

        <div className="panel">
          <h3>Graphics</h3>
          <p>
            Auto measures your frame rate and scales the background effects to match. Pick low if
            the intro or home page ever stutters.
          </p>
          <div className="row">
            {(['auto', 'low'] as const).map((option) => (
              <button
                key={option}
                className={`button ${quality === option ? '' : 'ghost'}`}
                onClick={() => setQuality(option)}
              >
                {option === 'auto' ? 'Auto' : 'Low'}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Saved data</h3>
          <p>Clears your theme, graphics choice and whether the intro has played.</p>
          <button className="button ghost" onClick={clearSaved}>
            {cleared ? 'Cleared' : 'Clear saved data'}
          </button>
        </div>
      </div>
    </section>
  );
}
