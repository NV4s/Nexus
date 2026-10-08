import { useEffect, useRef, useState } from 'react';
import { adoptStyles, shadowRoot } from '../lib/shadow';

export const EJS_VERSION = '4.2.3';
export const EJS_BASE = `/e/${EJS_VERSION}/`;

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_gameName?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_Buttons?: Record<string, boolean>;
    EJS_emulator?: { elements?: unknown };
  }
}

/*
 * EmulatorJS resolves its container with document.querySelector, which cannot
 * see into a closed shadow root, and it loads its stylesheet into document.head,
 * which does not reach inside one either. So: hand querySelector an answer for
 * our own selector, and copy the stylesheet into the shadow tree.
 */

const hosts = new Map<string, Element>();
let patched = false;

function registerHost(selector: string, element: Element) {
  hosts.set(selector, element);
  if (patched) return;
  patched = true;
  const native = document.querySelector.bind(document);
  document.querySelector = ((selector: string) =>
    hosts.get(selector) ?? native(selector)) as typeof document.querySelector;
}

let styles: Promise<void> | null = null;

/** url() inside the sheet is relative to the sheet; adopted, it would resolve
 *  against the page instead, so the paths are made absolute first. */
const loadStyles = () =>
  (styles ??= fetch(`${EJS_BASE}emulator.css`)
    .then((response) => (response.ok ? response.text() : ''))
    .then((css) => {
      if (css) adoptStyles(css.replace(/url\((['"]?)(?!data:|https?:|\/)/g, `url($1${EJS_BASE}`));
    })
    .catch(() => {}));

let seq = 0;

export default function EjsPlayer({
  core,
  url,
  name,
}: {
  core: string;
  url: string;
  name: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [selector] = useState(() => `#ejs-${(seq += 1)}`);
  const [error, setError] = useState('');

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !url) return;

    registerHost(selector, host);
    if (!shadowRoot()) {
      setError('The player could not attach to the page.');
      return;
    }

    let script: HTMLScriptElement | null = null;
    let cancelled = false;

    loadStyles().then(() => {
      if (cancelled) return;

      window.EJS_player = selector;
      window.EJS_core = core;
      window.EJS_gameUrl = url;
      window.EJS_gameName = name;
      window.EJS_pathtodata = EJS_BASE;
      window.EJS_startOnLoaded = true;

      script = document.createElement('script');
      script.src = `${EJS_BASE}loader.js`;
      script.onerror = () =>
        setError('Could not load the player. A network filter may be blocking it.');
      document.body.append(script);
    });

    return () => {
      cancelled = true;
      script?.remove();
      delete window.EJS_emulator;
      host.replaceChildren();
    };
  }, [core, url, name, selector]);

  return (
    <>
      {error && <p className="admin-error">{error}</p>}
      <div
        ref={hostRef}
        id={selector.slice(1)}
        className="emulator-host"
      />
    </>
  );
}
