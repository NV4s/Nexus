import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { CONSOLES, consoleById, type ConsoleId } from '../data/consoles';
import { useGameSession } from '../lib/achievements';

/** Pinned so an upstream change cannot break the page without a commit here. */
const EJS_VERSION = '4.2.3';
const EJS_BASE = `https://cdn.jsdelivr.net/npm/@emulatorjs/emulatorjs@${EJS_VERSION}/data/`;

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_gameName?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_Buttons?: Record<string, boolean>;
  }
}

/**
 * Console emulator, one ROM at a time.
 *
 * The ROM never leaves the device: it is read into a blob URL and handed to the
 * emulator, so nothing is uploaded and nothing is hosted here. That is also why
 * there is no game list — this site ships no ROMs.
 *
 * Save states are the emulator's own, reached from its toolbar, and they are
 * what "save state" actually means for a console: a snapshot of machine memory.
 * Flash has no equivalent, which is why the Flash side offers its save file
 * instead.
 */
export default function Emulator({ id }: { id: string }) {
  const console_ = consoleById(id as ConsoleId);
  const [rom, setRom] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useGameSession(console_ ? `emu-${console_.id}` : null);

  useEffect(() => {
    if (!rom || !console_) return;

    // EmulatorJS reads globals at script load, so they are set before injecting.
    window.EJS_player = '#emulator-host';
    window.EJS_core = console_.core;
    window.EJS_gameUrl = rom.url;
    window.EJS_gameName = rom.name;
    window.EJS_pathtodata = EJS_BASE;
    window.EJS_startOnLoaded = true;

    const script = document.createElement('script');
    script.src = `${EJS_BASE}loader.js`;
    script.onerror = () => setError('Could not load the emulator. A network filter may be blocking the CDN.');
    document.body.append(script);

    return () => {
      script.remove();
      // The loader builds inside the host; clearing it is what actually stops
      // the previous machine when a different ROM is chosen.
      if (hostRef.current) hostRef.current.replaceChildren();
    };
  }, [rom, console_]);

  useEffect(() => () => {
    if (rom) URL.revokeObjectURL(rom.url);
  }, [rom]);

  if (!console_) {
    return (
      <section className="section">
        <h2>Unknown console</h2>
      </section>
    );
  }

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>{console_.title}</h2>
          <p>
            Bring your own ROM — {console_.extensions.join(', ')}. It stays on this device; nothing
            is uploaded, and no games are hosted here.
          </p>
        </div>
      </header>

      {!rom && (
        <div className="panels">
          <div className="panel">
            <h3>Open a ROM</h3>
            <p>{console_.note}</p>
            <div className="row">
              <button className="button" onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> Choose a file
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept={console_.extensions.map((extension) => `.${extension}`).join(',')}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setError('');
                setRom({ name: file.name, url: URL.createObjectURL(file) });
              }}
            />
            <p>
              Save states live in the emulator&rsquo;s own toolbar once a game is running — the disk
              icon writes one, the folder icon loads it back.
            </p>
          </div>
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}

      <div className="game-frame">
        <div id="emulator-host" ref={hostRef} className="emulator-host" />
      </div>

      {rom && (
        <div className="row">
          <span className="player-field">{rom.name}</span>
          <button className="button ghost" onClick={() => setRom(null)}>
            Load a different ROM
          </button>
        </div>
      )}
    </section>
  );
}

export { CONSOLES };
