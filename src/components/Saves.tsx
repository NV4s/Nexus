import { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import {
  decodeSaves,
  deleteSave,
  exportSaves,
  importSaves,
  listSaves,
  saveFields,
  type SaveEntry,
} from '../lib/saves';
import { navigate } from '../lib/router';

const size = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;

/**
 * What a game actually stored. Decoding is gated behind opening the panel so a
 * large save is never parsed on the render path.
 *
 * The paths listed here are exactly what a rule in data/saveRules.ts takes, so
 * turning a game into real achievements is copying a line rather than
 * reverse-engineering its save format blind.
 */
function Inspector({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const fields = open ? saveFields(slug) : [];
  const problems = open ? decodeSaves(slug).filter((file) => file.error) : [];
  const dump = fields.map((field) => `${field.path} = ${field.value}`).join('\n');

  return (
    <details className="inspector" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Inspect save</summary>
      {open && (
        <>
          {problems.map((file) => (
            <p className="inspector-error" key={file.key}>
              Stopped reading: {file.error}
            </p>
          ))}
          {fields.length === 0 ? (
            <p>Nothing readable in this save.</p>
          ) : (
            <>
              <pre>{dump}</pre>
              <button
                className="button ghost"
                onClick={() => navigator.clipboard?.writeText(dump).catch(() => {})}
              >
                Copy
              </button>
            </>
          )}
        </>
      )}
    </details>
  );
}

export default function Saves() {
  const [entries, setEntries] = useState<SaveEntry[]>(listSaves);
  const [note, setNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportSaves()], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-saves-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restore = async (file: File) => {
    try {
      const count = await file.text().then(importSaves);
      setEntries(listSaves());
      setNote(`Restored ${count} ${count === 1 ? 'entry' : 'entries'}. Reopen a game to load it.`);
    } catch (cause) {
      setNote(cause instanceof Error ? cause.message : 'That file could not be read.');
    }
  };

  const remove = (entry: SaveEntry) => {
    deleteSave(entry);
    setEntries(listSaves());
    setNote(`Deleted the save for ${entry.game.title}.`);
  };

  const total = entries.reduce((sum, entry) => sum + entry.bytes, 0);

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Saves</h2>
          <p>Flash progress is stored on this device. Back it up before clearing your browser.</p>
        </div>
      </header>

      <div className="panels">
        <div className="panel">
          <h3>Backup</h3>
          <p>
            {entries.length
              ? `${entries.length} ${entries.length === 1 ? 'game has' : 'games have'} saved data, ${size(total)} in total.`
              : 'No Flash saves yet. Play a game that saves and it will appear here.'}
          </p>
          <div className="row">
            <button className="button" onClick={download} disabled={!entries.length}>
              <Download size={16} /> Export all
            </button>
            <button className="button ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) restore(file);
              event.target.value = ''; // let the same file be picked twice
            }}
          />
          {note && <p>{note}</p>}
        </div>

        <div className="panel">
          <h3>Other games</h3>
          <p>
            Games that are not Flash keep their own saves. n-gon runs on this site and saves
            normally; the GBA emulator and the study tools are other people&rsquo;s sites, so their
            data lives there and cannot be backed up from here.
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="panels">
          {entries.map((entry) => (
            <div className="panel" key={entry.game.slug}>
              <h3>{entry.game.title}</h3>
              <p>
                {size(entry.bytes)} · {entry.keys.length} {entry.keys.length === 1 ? 'file' : 'files'}
              </p>
              <div className="row">
                <button className="button ghost" onClick={() => navigate(`/game/${entry.game.slug}`)}>
                  Play
                </button>
                <button className="button ghost" onClick={() => remove(entry)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
              <Inspector slug={entry.game.slug} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
