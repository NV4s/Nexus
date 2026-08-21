import { useEffect, useState } from 'react';
import { readQualityPreference, writeQualityPreference, type QualityPreference } from '../lib/quality';
import { DEFAULT_LINK, comboFrom, label, readCombo, readLink } from '../lib/panic';

const setFavicon = (href: string) => {
  const icon = document.getElementById('favicon') as HTMLLinkElement | null;
  if (icon) icon.href = href;
};

export default function Settings() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark');
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');
  const [combo, setCombo] = useState(readCombo);
  const [link, setLink] = useState(readLink);
  const [recording, setRecording] = useState(false);
  const [quality, setQuality] = useState<QualityPreference>(readQualityPreference);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => writeQualityPreference(quality), [quality]);

  useEffect(() => localStorage.setItem('panicCombo', combo), [combo]);
  useEffect(() => localStorage.setItem('panicLink', link), [link]);

  useEffect(() => {
    localStorage.setItem('recordingPanicCombo', String(recording));
    if (!recording) return;

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      const next = comboFrom(event);
      if (!next) return; // modifier-only or bare key — keep listening
      setCombo(next);
      setRecording(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [recording]);

  const applyDisguise = () => {
    document.title = tabTitle || 'Google';
    setFavicon(tabIcon || 'https://www.google.com/favicon.ico');
  };

  const resetDisguise = () => {
    document.title = 'Nexus';
    setFavicon('/favicon.svg');
    setTabTitle('');
    setTabIcon('');
  };

  const cloak = () => {
    const win = window.open('about:blank', '_blank');
    if (!win) {
      alert('Your browser blocked the popup. Allow popups for this site and try again.');
      return;
    }
    const frame = win.document.createElement('iframe');
    frame.src = window.location.href;
    frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none';
    win.document.body.style.margin = '0';
    win.document.body.append(frame);
    window.location.replace(link);
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
          <button className="button ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </div>

        <div className="panel">
          <h3>Graphics</h3>
          <p>
            Auto measures your frame rate and scales the background effects to match. Pick low if
            the intro or the home page ever stutters.
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
          <h3>Tab disguise</h3>
          <p>Change the tab title and icon.</p>
          <input
            className="field"
            placeholder="Tab title"
            value={tabTitle}
            onChange={(event) => setTabTitle(event.target.value)}
          />
          <input
            className="field"
            placeholder="Icon URL"
            value={tabIcon}
            onChange={(event) => setTabIcon(event.target.value)}
          />
          <div className="row">
            <button className="button" onClick={applyDisguise}>
              Apply
            </button>
            <button className="button ghost" onClick={resetDisguise}>
              Reset
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Panic key</h3>
          <p>Leaves this page immediately. A modifier is required so it cannot fire mid-game.</p>
          <div className="row">
            <button className="button ghost" onClick={() => setRecording(true)}>
              {recording ? 'Press a combination…' : label(combo)}
            </button>
          </div>
          <input
            className="field"
            value={link}
            onChange={(event) => setLink(event.target.value || DEFAULT_LINK)}
          />
        </div>

        <div className="panel">
          <h3>about:blank</h3>
          <p>Reopens Nexus inside a blank tab and sends this one to your panic link.</p>
          <button className="button" onClick={cloak}>
            Open cloaked
          </button>
        </div>
      </div>
    </section>
  );
}
