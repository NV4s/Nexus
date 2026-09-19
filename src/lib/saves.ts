import { SWFDUMP_SHA } from '../data/swfdump.ts';
import { GAMES, type Game } from '../data/games.ts';
import { decodeSol, type SolValue } from './sol.ts';

/** Empty off the browser, which is fine: the node tests only exercise the
 *  host-less shape. */
const HOST = typeof location === 'undefined' ? '' : location.host;


const STALE_SHA = /((?:\/m|\/mr|\/ml)\/)[0-9a-f]{40}(?=\/)/g;

/**
 * Ruffle keys a save by the movie's own URL, so moving the SWFs off the public
 * CDNs and behind /m, /mr and /ml changed every key. These rewrite the old ones.
 * Ruffle includes the host when the URL had one, so the replacement puts this
 * site's host in its place; a key that never carried a host keeps not having one.
 */
const MOVED_SWF: [RegExp, string][] = [
  [/(^|[^a-z])cdn\.jsdelivr\.net\/gh\/NV4s\/swfdump@([0-9a-f]{40})\//g, `$1${HOST}/m/$2/`],
  [/(^|[^a-z])raw\.githubusercontent\.com\/NV4s\/swfdump\/([0-9a-f]{40})\//g, `$1${HOST}/mr/$2/`],
  [/(^|[^a-z])media\.githubusercontent\.com\/media\/NV4s\/swfdump\/([0-9a-f]{40})\//g, `$1${HOST}/ml/$2/`],
  [/(^|\/)gh\/NV4s\/swfdump@([0-9a-f]{40})\//g, '$1m/$2/'],
  [/(^|\/)NV4s\/swfdump\/([0-9a-f]{40})\//g, '$1mr/$2/'],
  [/(^|\/)media\/NV4s\/swfdump\/([0-9a-f]{40})\//g, '$1ml/$2/'],
];

/** The path the SWFs live under now, whatever origin the site is served from. */
const relocate = (key: string) =>
  MOVED_SWF.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), key);


export function migrateSaveKeys() {
  try {

    for (const key of Object.keys(localStorage)) {
      const current = relocate(key).replace(STALE_SHA, `$1${SWFDUMP_SHA}`);
      if (current === key) continue;

      const value = localStorage.getItem(key);
      if (value === null) continue;



      if (localStorage.getItem(current) === null) localStorage.setItem(current, value);
      localStorage.removeItem(key);
    }
  } catch {}
}

export type SaveEntry = { game: Game; bytes: number; keys: string[] };


const swfFileIn = (key: string) => {
  const match = key.match(/[^/]+\.swf/i);
  if (!match) return null;
  try {
    return decodeURIComponent(match[0]);
  } catch {
    return match[0];
  }
};

let index: Map<string, Game> | null = null;
const flashGamesByFile = () =>
  (index ??= new Map(
    GAMES.filter((game) => game.runtime === 'flash').map((game) => [game.src.split('/').pop()!, game]),
  ));


export function listSaves(): SaveEntry[] {
  const found = new Map<string, SaveEntry>();
  try {
    for (const key of Object.keys(localStorage)) {
      const file = swfFileIn(key);
      const game = file && flashGamesByFile().get(file);
      if (!game) continue;

      const entry = found.get(game.slug) ?? { game, bytes: 0, keys: [] };
      entry.bytes += (localStorage.getItem(key) ?? '').length;
      entry.keys.push(key);
      found.set(game.slug, entry);
    }
  } catch {
    return [];
  }
  return [...found.values()].sort((a, b) => a.game.title.localeCompare(b.game.title));
}


export const exportSaves = () =>
  JSON.stringify(
    { format: 'nexus-saves/1', sha: SWFDUMP_SHA, saved: Object.fromEntries(
      listSaves().flatMap((entry) => entry.keys.map((key) => [key, localStorage.getItem(key) ?? ''])),
    ) },
    null,
    2,
  );


export function importSaves(json: string): number {
  const parsed: unknown = JSON.parse(json);
  const saved =
    typeof parsed === 'object' && parsed && 'saved' in parsed
      ? (parsed as { saved: Record<string, string> }).saved
      : null;
  if (!saved) throw new Error('Not a Nexus save file.');

  let written = 0;
  for (const [key, value] of Object.entries(saved)) {
    if (typeof value !== 'string') continue;
    localStorage.setItem(key, value);
    written++;
  }
  migrateSaveKeys();
  return written;
}

export const deleteSave = (entry: SaveEntry) => entry.keys.forEach((key) => localStorage.removeItem(key));

export type SaveFile = {
  key: string;

  name: string;
  data: Record<string, SolValue>;

  error?: string;
};


const bytesOf = (value: string) => {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};


export function saveRawFor(slug: string): string | null {
  try {
    const parts: string[] = [];
    for (const key of Object.keys(localStorage).sort()) {
      const file = swfFileIn(key);
      if (!file) continue;
      if (flashGamesByFile().get(file)?.slug === slug) parts.push(localStorage.getItem(key) ?? '');
    }
    return parts.length ? parts.join('|') : null;
  } catch {
    return null;
  }
}


export function decodeSaves(slug: string): SaveFile[] {
  const files: SaveFile[] = [];
  try {
    for (const key of Object.keys(localStorage)) {
      const file = swfFileIn(key);
      const game = file && flashGamesByFile().get(file);
      if (!game || game.slug !== slug) continue;

      const raw = localStorage.getItem(key);
      const bytes = raw && bytesOf(raw);
      if (!bytes) continue;

      const decoded = decodeSol(bytes);
      files.push({ key, name: decoded.name, data: decoded.data, error: decoded.error });
    }
  } catch {
    return [];
  }
  return files;
}


const MAX_FIELDS = 400;


export function saveFields(slug: string, maxDepth = 6): { path: string; value: string }[] {
  const rows: { path: string; value: string }[] = [];

  const walk = (node: SolValue, path: string, depth: number) => {
    if (rows.length >= MAX_FIELDS) return;

    if (node === null || typeof node !== 'object') {
      rows.push({ path, value: typeof node === 'string' ? `"${node}"` : String(node) });
      return;
    }

    if ('$bytes' in node) {
      return rows.push({ path, value: `<${(node as { $bytes: number }).$bytes} bytes>` });
    }
    if ('$date' in node) {
      const ms = (node as { $date: number }).$date;
      return rows.push({ path, value: Number.isFinite(ms) ? new Date(ms).toISOString() : String(ms) });
    }
    if (depth >= maxDepth) return rows.push({ path, value: '…' });

    const entries: [string, SolValue][] = Array.isArray(node)
      ? node.map((item, index) => [String(index), item])
      : Object.entries(node);


    if (!entries.length) return rows.push({ path, value: Array.isArray(node) ? '[]' : '{}' });

    for (const [key, item] of entries) walk(item, path ? `${path}.${key}` : key, depth + 1);
  };

  for (const file of decodeSaves(slug)) {
    for (const [key, value] of Object.entries(file.data)) walk(value, key, 1);
  }
  return rows;
}


export function readSavePath(slug: string, path: string): SolValue | undefined {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length) return undefined;

  for (const file of decodeSaves(slug)) {
    const rest = segments[0] === file.name ? segments.slice(1) : segments;
    let node: SolValue | undefined = file.data as SolValue;

    for (const segment of rest) {
      if (node === null || typeof node !== 'object') {
        node = undefined;
        break;
      }
      node = (node as Record<string, SolValue>)[segment];
      if (node === undefined) break;
    }
    if (node !== undefined) return node;
  }
  return undefined;
}


export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}


export function downloadGameSave(slug: string): number {
  let written = 0;
  for (const file of decodeSaves(slug)) {
    const raw = localStorage.getItem(file.key);
    const bytes = raw && bytesOf(raw);
    if (!bytes) continue;

    downloadBlob(new Blob([bytes.slice()], { type: 'application/octet-stream' }), `${file.name || slug}.sol`);
    written++;
  }
  return written;
}


export function downloadGameBackup(slug: string) {
  const entries = decodeSaves(slug).map((file) => [file.key, localStorage.getItem(file.key) ?? '']);
  if (!entries.length) return false;
  const body = JSON.stringify(
    { format: 'nexus-saves/1', sha: SWFDUMP_SHA, saved: Object.fromEntries(entries) },
    null,
    2,
  );
  downloadBlob(new Blob([body], { type: 'application/json' }), `${slug}-save.json`);
  return true;
}
