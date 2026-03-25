import React, { useState, useEffect } from 'react';

interface SettingsProps {
  toggleTheme: () => void;
}

export default function Settings({ toggleTheme }: SettingsProps) {
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');
  
  const [panicKey, setPanicKey] = useState(localStorage.getItem('panicKey') || '`');
  const [panicLink, setPanicLink] = useState(localStorage.getItem('panicLink') || 'https://classroom.google.com');
  const [isRecordingKey, setIsRecordingKey] = useState(false);

  useEffect(() => {
    localStorage.setItem('panicKey', panicKey);
  }, [panicKey]);

  useEffect(() => {
    localStorage.setItem('panicLink', panicLink);
  }, [panicLink]);

  useEffect(() => {
    if (isRecordingKey) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        setPanicKey(e.key);
        setIsRecordingKey(false);
        localStorage.setItem('recordingPanicKey', 'false');
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isRecordingKey]);

  const startRecordingKey = () => {
    setIsRecordingKey(true);
    localStorage.setItem('recordingPanicKey', 'true');
  };

  const setDisguise = () => {
    if (tabTitle) document.title = tabTitle;
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    if (favicon) {
      if (tabIcon) {
        favicon.href = tabIcon;
      } else {
        favicon.href = "https://www.google.com/favicon.ico";
        document.title = tabTitle || "Google";
      }
    }
  };

  const resetDisguise = () => {
    document.title = "NEXUS | Portal";
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    if (favicon) {
      favicon.href = "";
    }
    setTabTitle('');
    setTabIcon('');
  };

  const cloakPage = () => {
    let win = window.open('about:blank', '_blank');
    if (!win) {
      alert("Popup blocker prevented the cloak! Please allow popups for this site.");
      return;
    }

    let iframe = win.document.createElement('iframe');
    iframe.src = window.location.href;
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.margin = '0';
    iframe.style.padding = '0';

    win.document.body.style.margin = '0';
    win.document.body.style.overflow = 'hidden';
    win.document.body.appendChild(iframe);

    window.location.replace("https://classroom.google.com");
  };

  return (
    <div id="Settings">
      <h2 className="section-title">System Settings</h2>

      <div className="settings-panel">
        <div className="settings-group">
          <h3>Appearance</h3>
          <button className="action-btn" onClick={toggleTheme}>Toggle Light/Dark Mode</button>
        </div>

        <div className="settings-group">
          <h3>Tab Disguise (Google Cloak)</h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Change the tab name and icon to hide what you are doing.</p>
          <input
            type="text"
            className="input-box"
            placeholder="New Tab Title (e.g., Google)"
            value={tabTitle}
            onChange={(e) => setTabTitle(e.target.value)}
          />
          <input
            type="text"
            className="input-box"
            placeholder="Icon Image URL (e.g., https://google.com/favicon.ico)"
            value={tabIcon}
            onChange={(e) => setTabIcon(e.target.value)}
          />
          <button className="action-btn" onClick={setDisguise} style={{ marginRight: '0.5rem' }}>Apply Disguise</button>
          <button className="action-btn" onClick={resetDisguise}>Reset</button>
        </div>

        <div className="settings-group">
          <h3>Panic Button</h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Set a keybind that will instantly redirect this page to a safe link.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-box"
              placeholder="Safe Link (e.g., https://classroom.google.com)"
              value={panicLink}
              onChange={(e) => setPanicLink(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button
              className="action-btn"
              onClick={startRecordingKey}
              style={{ minWidth: '150px' }}
            >
              {isRecordingKey ? 'Press any key...' : `Keybind: ${panicKey === ' ' ? 'Space' : panicKey}`}
            </button>
          </div>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Opens this entire website inside an undetectable 'about:blank' page, shielding it from browser history and extensions.</p>
          <button className="action-btn danger-btn" onClick={cloakPage}>Launch About:Blank Cloak</button>
        </div>
      </div>
    </div>
  );
}
