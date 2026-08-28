import { useEffect, useRef, useState } from 'react';
import { readQualityPreference, writeQualityPreference, type QualityPreference } from '../lib/quality';
import {
  DEFAULT_LINK,
  comboFrom,
  label,
  readCombo,
  readLink,
  readPanicMode,
  writePanicMode,
  type PanicMode,
} from '../lib/panic';
import { openCloaked } from '../lib/launch';
import {
  DEFAULT_PREFS,
  FRAME_RATES,
  QUALITIES,
  readPlayerPrefs,
  writePlayerPrefs,
} from '../lib/player';
import { downloadBlob } from '../lib/saves';
import { describe, exportEverything, importAnything } from '../lib/transfer';

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
  const [panicMode, setPanicMode] = useState<PanicMode>(readPanicMode);
  const [player, setPlayer] = useState(readPlayerPrefs);
  const [note, setNote] = useState('');
  const progressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => writeQualityPreference(quality), [quality]);

  useEffect(() => writePanicMode(panicMode), [panicMode]);

  const setPlayerPref = (change: Parameters<typeof writePlayerPrefs>[0]) => {
    writePlayerPrefs(change);
    setPlayer(readPlayerPrefs());
  };

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
    if (!openCloaked(window.location.href, link)) {
      alert('Your browser blocked the popup. Allow popups for this site and try again.');
    }
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
          <div className="row">
            {(['replace', 'newtab'] as const).map((mode) => (
              <button
                key={mode}
                className={`button ${panicMode === mode ? '' : 'ghost'}`}
                onClick={() => setPanicMode(mode)}
              >
                {mode === 'replace' ? 'Replace this tab' : 'New tab, close this one'}
              </button>
            ))}
          </div>
          <p>
            A page can only close a tab that a page opened. Launch through <b>Open cloaked</b> below
            and the second option really does delete the tab — your link opens in a fresh one and
            this tab disappears. Opened any other way it cannot close, so it is left blank instead,
            which is the closest a page is allowed to get.
          </p>
        </div>


        <div className="panel">
          <h3>Flash player</h3>
          <p>
            Applies to every Flash game. A game reloads when these change, so finish what you are
            doing first.
          </p>
          <div className="row">
            <label className="player-field">
              FPS
              <select
                value={player.frameRate}
                onChange={(event) => setPlayerPref({ frameRate: Number(event.target.value) })}
              >
                {FRAME_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate === 0 ? 'Game default' : rate}
                  </option>
                ))}
              </select>
            </label>
            <label className="player-field">
              Quality
              <select
                value={player.quality}
                onChange={(event) =>
                  setPlayerPref({ quality: event.target.value as typeof player.quality })
                }
              >
                {QUALITIES.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality[0].toUpperCase() + quality.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="player-field">
              Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={player.volume}
                onChange={(event) => setPlayerPref({ volume: Number(event.target.value) })}
              />
            </label>
          </div>
          <div className="row">
            <button
              className={`button ${player.letterbox ? '' : 'ghost'}`}
              onClick={() => setPlayerPref({ letterbox: !player.letterbox })}
            >
              Letterbox {player.letterbox ? 'on' : 'off'}
            </button>
            <button
              className={`button ${player.stretch ? '' : 'ghost'}`}
              onClick={() => setPlayerPref({ stretch: !player.stretch })}
              title="Fills the frame even when a game asks to stay at its authored size"
            >
              Stretch to fit {player.stretch ? 'on' : 'off'}
            </button>
            <button
              className={`button ${player.swfDownload ? '' : 'ghost'}`}
              onClick={() => setPlayerPref({ swfDownload: !player.swfDownload })}
              title="Adds Ruffle's own download entry to the right-click menu"
            >
              Right-click download {player.swfDownload ? 'on' : 'off'}
            </button>
            <button className="button ghost" onClick={() => setPlayerPref(DEFAULT_PREFS)}>
              Reset
            </button>
          </div>
          <p>
            Raising FPS makes some games run faster rather than smoother, because a lot of Flash
            games tie their speed to the frame rate. Lower quality helps on a slow machine.
          </p>
        </div>

        <div className="panel">
          <h3>Move progress to another device</h3>
          <p>
            One file with your achievements, playtime and game saves. Importing merges rather than
            replaces: it can only add unlocks and keep the larger playtime, so an older file never
            undoes newer progress.
          </p>
          <div className="row">
            <button
              className="button"
              onClick={() =>
                downloadBlob(
                  new Blob([exportEverything()], { type: 'application/json' }),
                  `nexus-backup-${new Date().toISOString().slice(0, 10)}.json`,
                )
              }
            >
              Export everything
            </button>
            <button className="button ghost" onClick={() => progressRef.current?.click()}>
              Import
            </button>
          </div>
          <input
            ref={progressRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              try {
                // Takes a full backup, an achievements file or a saves file —
                // picking the wrong button used to fail with an unhelpful message.
                setNote(describe(importAnything(await file.text())));
              } catch (cause) {
                setNote(cause instanceof Error ? cause.message : 'That file could not be read.');
              }
            }}
          />
          {note && <p>{note}</p>}
        </div>
        <div className="panel">
          <h3>about:blank</h3>
          <p>
            Reopens Nexus inside a blank tab and sends this one to your panic link. A tab opened
            this way can close itself, which is what makes the panic key delete it outright.
          </p>
          <button className="button" onClick={cloak}>
            Open cloaked
          </button>
        </div>

        <div className="panel">
          <h3>Advertising</h3>
          <p>
            The ad positions are built but switched off, and take up no space until a publisher id
            is set. Add <code>?adpreview=1</code> to any page to see where they will go. Setup is
            written up in <code>docs/ads.md</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
