import { useEffect, useRef, useState } from 'react';

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
}: {
  url: string;
  title: string;
  parts?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
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

        const player = ruffle.newest().createPlayer();
        player.style.width = '100%';
        player.style.height = '100%';
        container.replaceChildren(player);

        await player.load({
          data,
          // Relative asset loads inside the SWF resolve against its own directory.
          base: new URL(url, window.location.href).href.replace(/[^/]*$/, ''),
          autoplay: 'on',
          // Third-party SWFs get no reach into this page.
          allowScriptAccess: false,
          letterbox: 'on',
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
  }, [url, parts, attempt]);

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
