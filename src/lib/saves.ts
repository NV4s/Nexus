import { SWFDUMP_SHA } from '../data/swfdump';
import { GAMES, type Game } from '../data/games';
import { decodeSol, type SolValue } from './sol';

/**
 * Ruffle keys Flash SharedObjects by the SWF's URL, and every swfdump URL carries
 * the commit SHA — `…/NV4s/swfdump/<sha>/Bloxorz.swf` on raw, `…/NV4s/swfdump@<sha>/…`
 * on jsDelivr. Regenerating the catalog therefore moves every key at once and
 * orphans every save on every device. Matches both host forms.
 */
const STALE_SHA = /(NV4s\/swfdump[@/])[0-9a-f]{40}(?=\/)/g;

/**
 * Re-points saves written under an older catalog SHA at the current one, so a
 * catalog regeneration does not silently wipe everyone's progress.
 *
 * Idempotent: once a key is current it no longer matches a rewrite.
 */
export function migrateSaveKeys() {
  try {
    // Object.keys snapshots, so removing entries mid-loop is safe.
    for (const key of Object.keys(localStorage)) {
      const current = key.replace(STALE_SHA, `$1${SWFDUMP_SHA}`);
      if (current === key) continue;

      const value = localStorage.getItem(key);
      if (value === null) continue;

      // A save already at the current SHA is the one being played — keep it and
      // drop the stale copy rather than overwriting live progress with old bytes.
      if (localStorage.getItem(current) === null) localStorage.setItem(current, value);
      localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked or full. Saves are best-effort and must never block boot.
  }
}

/* ---------- backup and restore ---------- */

export type SaveEntry = { game: Game; bytes: number; keys: string[] };

/** Ruffle's key embeds the SWF's own URL, so the filename inside it names the game. */
const swfFileIn = (key: string) => {
  const match = key.match(/[^/]+\.swf/i);
  if (!match) return null;
  try {
    return decodeURIComponent(match[0]);
  } catch {
    return match[0]; // malformed escape — compare the raw form instead
  }
};

let index: Map<string, Game> | null = null;
const flashGamesByFile = () =>
  (index ??= new Map(
    GAMES.filter((game) => game.runtime === 'flash').map((game) => [game.src.split('/').pop()!, game]),
  ));

/** Every game that currently holds Flash save data on this device. */
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

/** One JSON file holding every Flash save, so progress survives a wiped browser. */
export const exportSaves = () =>
  JSON.stringify(
    { format: 'nexus-saves/1', sha: SWFDUMP_SHA, saved: Object.fromEntries(
      listSaves().flatMap((entry) => entry.keys.map((key) => [key, localStorage.getItem(key) ?? ''])),
    ) },
    null,
    2,
  );

/**
 * Restores a backup, returning how many entries were written. Keys are migrated
 * afterwards, so a backup taken under an older catalog SHA still lands correctly.
 */
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

/* ---------- reading what is inside a save ---------- */

export type SaveFile = {
  key: string;
  /** The SharedObject's own name, from the file header. */
  name: string;
  data: Record<string, SolValue>;
  /** Set when decoding stopped early; `data` still holds everything read first. */
  error?: string;
};

/** Ruffle's own encoding: base64 of the raw .sol bytes. */
const bytesOf = (value: string) => {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return null; // not base64, so not one of Ruffle's saves
  }
};

/**
 * The game's raw save bytes, still base64, joined in key order — or null if it
 * has never saved.
 *
 * Deliberately not decoded: this exists to answer "is there a save" and "has it
 * changed", and comparing the stored strings does that for a 270 KB save without
 * parsing it on every check.
 */
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

/** Every SharedObject this game holds, decoded. Never throws. */
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

/** Guards a pathological save from producing an unreadable wall of rows. */
const MAX_FIELDS = 400;

/**
 * Flattened `path → value` pairs for the inspector.
 *
 * The paths printed here are exactly the strings a rule in data/saveRules.ts
 * takes, so mapping a game is reading this list rather than reverse-engineering.
 */
export function saveFields(slug: string, maxDepth = 6): { path: string; value: string }[] {
  const rows: { path: string; value: string }[] = [];

  const walk = (node: SolValue, path: string, depth: number) => {
    if (rows.length >= MAX_FIELDS) return;

    if (node === null || typeof node !== 'object') {
      rows.push({ path, value: typeof node === 'string' ? `"${node}"` : String(node) });
      return;
    }
    // `in` does not narrow the union to the numeric member, hence the casts.
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

    // An empty container is worth showing: it is still a path a rule can test.
    if (!entries.length) return rows.push({ path, value: Array.isArray(node) ? '[]' : '{}' });

    for (const [key, item] of entries) walk(item, path ? `${path}.${key}` : key, depth + 1);
  };

  for (const file of decodeSaves(slug)) {
    for (const [key, value] of Object.entries(file.data)) walk(value, key, 1);
  }
  return rows;
}

/**
 * One value by dotted path, e.g. `slots.1.wave`. A leading segment matching a
 * SharedObject's name selects that file; otherwise every file is tried in turn.
 * Returns undefined for anything missing — never throws.
 */
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
