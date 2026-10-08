import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { CONSOLES, consoleById, type ConsoleId } from '../data/consoles';
import { useGameSession } from '../lib/achievements';
import AdSlot from './AdSlot';
import { railsClass } from '../lib/ads';
import EjsPlayer from './EjsPlayer';

export default function Emulator({ id }: { id: string }) {
  const console_ = consoleById(id as ConsoleId);
  const [rom, setRom] = useState<{ name: string; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useGameSession(console_ ? `emu-${console_.id}` : null);

  useEffect(() => () => {
    // Only the picker's blob needs revoking; a hosted file is an ordinary url.
    if (rom?.url.startsWith('blob:')) URL.revokeObjectURL(rom.url);
  }, [rom]);

  if (!console_) {
    return (
      <section className="section">
        <h2>Unknown system</h2>
      </section>
    );
  }

  const hosted = console_.hosted;
  const loaded = hosted?.url ? { name: console_.title, url: hosted.url } : rom;

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>{console_.title}</h2>
          <p>
            {hosted
              ? console_.note
              : `Bring your own file — ${console_.extensions.join(', ')}. It stays on this device; nothing is uploaded, and no games are hosted here.`}
          </p>
        </div>
      </header>

      {hosted?.error && (
        <div className="panels">
          <div className="panel">
            <h3>No file set yet</h3>
            <p>{hosted.error}</p>
          </div>
        </div>
      )}

      {!hosted && !rom && (
        <div className="panels">
          <div className="panel">
            <h3>Open a file</h3>
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
                setRom({ name: file.name, url: URL.createObjectURL(file) });
              }}
            />
            <p>
              Save states live in the player&rsquo;s own toolbar once something is running — the
              disk icon writes one, the folder icon loads it back.
            </p>
          </div>
        </div>
      )}

      <div className={railsClass()}>
        <AdSlot name="rail-left" className="rail" />

        <div className="game-frame">
          {loaded && <EjsPlayer core={console_.core} url={loaded.url} name={loaded.name} />}
        </div>

        <AdSlot name="rail-right" className="rail" />
      </div>

      {rom && !hosted && (
        <div className="row">
          <span className="player-field">{rom.name}</span>
          <button className="button ghost" onClick={() => setRom(null)}>
            Load a different file
          </button>
        </div>
      )}
    </section>
  );
}

export { CONSOLES };
