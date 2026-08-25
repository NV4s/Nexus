import { SWFDUMP_SHA } from '../data/swfdump';
import { GAMES, type Game } from '../data/games';

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
