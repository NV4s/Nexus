import { useEffect, useRef, useState } from 'react';
import { Download, Gauge, RotateCcw, Save } from 'lucide-react';
import { downloadBlob, downloadGameSave } from '../lib/saves';
import { FRAME_RATES, QUALITIES, readPlayerPrefs, ruffleOptions, writePlayerPrefs } from '../lib/player';

declare global {
  interface Window {
    RufflePlayer?: { newest(): { createPlayer(): HTMLElement & { load(options: object): Promise<void> } } };
  }
}

let runtime: Promise<NonNullable<Window['RufflePlayer']>> | null = null;

/** Loads the vendored Ruffle build once per session, however many games are opened. */
function loadRuffle() {
  runtime ??= new Promise((resolve, reject) => {
    if (window.RufflePlayer) return resolve(window.RufflePlayer);
    const script = document.createElement('script');
    script.src = '/ruffle/ruffle.js';
    script.onload = () =>
      window.RufflePlayer
        ? resolve(window.RufflePlayer)
        : reject(new Error('Ruffle loaded but exposed no player'));
    script.onerror = () => {
      runtime = null; // let a retry try again
      reject(new Error('Could not load the Flash runtime'));
    };
    document.head.append(script);
  });
  return runtime;
}

const concat = (parts: Uint8Array[]) => {
  const merged = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
};

/** Streams one file so the progress bar reflects the real download, not a guess. */
async function fetchFile(url: string, onProgress: (fraction: number) => void) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Server returned ${response.status}`);

  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body || !total) return new Uint8Array(await response.arrayBuffer());

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(received / total);
  }

  return concat(chunks);
}

/**
 * Fetches the SWF. Files too large for a single GitHub blob are stored as
 * `<url>.001`, `.002`, … and rejoined here, which yields the exact original bytes.
 */
async function fetchSwf(url: string, parts: number, onProgress: (fraction: number) => void) {
  if (parts < 2) return (await fetchFile(url, onProgress)).buffer;

  const downloaded: Uint8Array[] = [];
  for (let i = 0; i < parts; i++) {
    const suffix = String(i + 1).padStart(3, '0');
    // Chunks are near-equal in size, so each one is an equal slice of the bar.
    downloaded.push(await fetchFile(`${url}.${suffix}`, (f) => onProgress((i + f) / parts)));
  }
  return concat(downloaded).buffer;
}

export default function RufflePlayer({
  url,
  title,
  parts = 1,
  slug,
}: {
  url: string;
  title: string;
  parts?: number;
  /** Enables the save controls; the player itself does not need to know the game. */
  slug?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Kept so the SWF can be saved without downloading it a second time.
  const dataRef = useRef<ArrayBuffer | null>(null);
  const [prefs, setPrefs] = useState(readPlayerPrefs);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    setStatus('loading');
    setProgress(0);

    (async () => {
      try {
        const [ruffle, data] = await Promise.all([
          loadRuffle(),
          fetchSwf(url, parts, (fraction) => !cancelled && setProgress(fraction)),
        ]);
        if (cancelled) return;

        dataRef.current = data;
        const player = ruffle.newest().createPlayer();
        player.style.width = '100%';
        player.style.height = '100%';
        container.replaceChildren(player);

        await player.load({
          data,
          // Relative asset loads inside the SWF resolve against its own directory.
          base: new URL(url, window.location.href).href.replace(/[^/]*$/, ''),
          ...ruffleOptions(prefs),
        });
        if (!cancelled) setStatus('ready');
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : String(cause));
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [url, parts, attempt, prefs]);

  const set = (change: Parameters<typeof writePlayerPrefs>[0]) => {
    writePlayerPrefs(change);
    setPrefs(readPlayerPrefs()); // re-reads so a partial change keeps the rest
  };

  const saveSwf = () => {
    if (!dataRef.current) return;
    const name = decodeURIComponent(url.split('/').pop() || `${title}.swf`);
    downloadBlob(new Blob([dataRef.current], { type: 'application/x-shockwave-flash' }), name);
  };

  return (
    <div className="stage">
      <div ref={containerRef} className="stage-surface" />

      {status === 'loading' && (
        <div className="stage-overlay">
          <p>Loading {title}</p>
          <div className="progress">
            <div style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <span>{Math.round(progress * 100)}%</span>
        </div>
      )}

      {status === 'ready' && (
        <div className="player-bar">
          <button className="button ghost" onClick={() => setAttempt((n) => n + 1)} title="Restart the game">
            <RotateCcw size={14} /> Restart
          </button>

          <button className="button ghost" onClick={saveSwf} title="Download the .swf file itself">
            <Download size={14} /> SWF
          </button>

          {slug && (
            <button
              className="button ghost"
              title="Download this game's save file"
              onClick={() => {
                const written = downloadGameSave(slug);
                setNote(written ? '' : 'This game has not saved anything yet.');
              }}
            >
              <Save size={14} /> Save file
            </button>
          )}

          <label className="player-field" title="Frames per second">
            <Gauge size={14} />
            <select
              value={prefs.frameRate}
              onChange={(event) => set({ frameRate: Number(event.target.value) })}
            >
              {FRAME_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate === 0 ? 'Default FPS' : `${rate} FPS`}
                </option>
              ))}
            </select>
          </label>

          <label className="player-field" title="Render quality">
            <select
              value={prefs.quality}
              onChange={(event) => set({ quality: event.target.value as typeof prefs.quality })}
            >
              {QUALITIES.map((quality) => (
                <option key={quality} value={quality}>
                  {quality[0].toUpperCase() + quality.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="player-field" title="Volume">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={prefs.volume}
              onChange={(event) => set({ volume: Number(event.target.value) })}
            />
          </label>

          {note && <span className="player-note">{note}</span>}
        </div>
      )}

      {status === 'error' && (
        <div className="stage-overlay">
          <p>{title} did not load.</p>
          <span>{error}</span>
          <button className="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
