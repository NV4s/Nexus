import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../data/achievements.ts';
import { SAVE_RULES, passes } from '../data/saveRules.ts';
import { listSaves, readSavePath, saveRawFor } from './saves.ts';

/**
 * What unlocks by itself.
 *
 * `played`, `time30`, `time120` and `sessions5` come from watching the page.
 * `saved` and `save-changed` come from the game's own save file, which Ruffle
 * keeps in localStorage — so they are real progress in the game rather than time
 * spent in front of it, and they need no per-game knowledge to work.
 *
 * Anything more specific than that ("reach stage 12") needs the game's own field
 * names, which live in data/saveRules.ts.
 */
export type AutoRule = 'played' | 'time30' | 'time120' | 'sessions5' | 'saved' | 'save-changed';

export type Achievement = {
  id: string;
  name: string;
  hint: string;
  /** Present = unlocks itself. Absent = the player ticks it. */
  auto?: AutoRule;
};

export type Progress = { seconds: number; sessions: number };

const UNLOCKED = (slug: string) => `nexus:ach:${slug}`;
const PROGRESS = (slug: string) => `nexus:play:${slug}`;

/** A full disk or a blocked store must never take a game down with it. */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* progress is a nicety, not a feature to fail loudly */
  }
}

/** Play-based objectives for a game with no researched list of its own. */
const GENERIC: Achievement[] = [
  { id: 'played', name: 'First run', hint: 'Open the game.', auto: 'played' },
  { id: 'time30', name: 'Settled in', hint: 'Play for 30 minutes in total.', auto: 'time30' },
  { id: 'sessions5', name: 'Regular', hint: 'Come back for five separate sessions.', auto: 'sessions5' },
];

/**
 * Added to any game that actually keeps a save. Appended rather than written into
 * every list because a game that never saves would otherwise show two objectives
 * it can never earn.
 */
const SAVE_AWARE: Achievement[] = [
  {
    id: 'save-made',
    name: 'Progress saved',
    hint: 'The game wrote its own save file.',
    auto: 'saved',
  },
  {
    id: 'save-advanced',
    name: 'Further than before',
    hint: 'Your save changed between visits, so you got somewhere new.',
    auto: 'save-changed',
  },
];

export const achievementsFor = (slug: string): Achievement[] => {
  const base = ACHIEVEMENTS[slug] ?? GENERIC;
  return saveRawFor(slug) ? [...base, ...SAVE_AWARE] : base;
};

export const readProgress = (slug: string): Progress => read(PROGRESS(slug), { seconds: 0, sessions: 0 });

export const readUnlocked = (slug: string): Set<string> => new Set(read<string[]>(UNLOCKED(slug), []));

const save = (slug: string, ids: Set<string>) => {
  write(UNLOCKED(slug), [...ids]);
  return ids;
};

const SIGNATURE = (slug: string) => `nexus:savesig:${slug}`;

/** Cheap, stable fingerprint of a string — only ever compared for equality. */
function fingerprint(text: string) {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) | 0;
  return `${text.length}:${value}`;
}

type SaveFacts = { exists: boolean; changed: boolean };

/**
 * Compares the game's save against the one seen last time, and remembers the new
 * one. A change means the game recorded something it had not before, which is
 * the closest thing to real progress that works without knowing a game's format.
 */
function saveFacts(slug: string): SaveFacts {
  const raw = saveRawFor(slug);
  if (raw === null) return { exists: false, changed: false };

  const current = fingerprint(raw);
  let previous: string | null = null;
  try {
    previous = localStorage.getItem(SIGNATURE(slug));
    if (previous !== current) localStorage.setItem(SIGNATURE(slug), current);
  } catch {
    /* unreadable storage just means this cannot be judged */
  }

  // A first sighting is not a change: there is nothing to have moved on from.
  return { exists: true, changed: previous !== null && previous !== current };
}

const earned = (rule: AutoRule, progress: Progress, saves: SaveFacts) => {
  switch (rule) {
    case 'played':
      return true;
    case 'time30':
      return progress.seconds >= 1800;
    case 'time120':
      return progress.seconds >= 7200;
    case 'sessions5':
      return progress.sessions >= 5;
    case 'saved':
      return saves.exists;
    case 'save-changed':
      return saves.changed;
  }
};

/** Achievements this game unlocks from its own save file rather than from playtime. */
export const saveDriven = (slug: string) => SAVE_RULES[slug] ?? {};

/**
 * Re-checks every self-unlocking objective: the playtime ones against progress,
 * and the save-driven ones against what the game actually stored.
 *
 * Unlocks are only ever added, never removed. Deleting a save stops a rule
 * matching, but the achievement stays — it records that something happened.
 */
function applyAuto(slug: string, progress = readProgress(slug)) {
  const unlocked = readUnlocked(slug);
  // Read once and shared: this also records the current save, so calling it per
  // achievement would compare the save against itself and never see a change.
  const saves = saveFacts(slug);

  for (const achievement of achievementsFor(slug)) {
    if (achievement.auto && earned(achievement.auto, progress, saves)) unlocked.add(achievement.id);
  }

  for (const [id, rule] of Object.entries(saveDriven(slug))) {
    if (passes(rule, readSavePath(slug, rule.path))) unlocked.add(id);
  }

  return save(slug, unlocked);
}

/** Call when the player opens a game: 'played' should land immediately, not on exit. */
export const markPlayed = (slug: string) => applyAuto(slug);

/**
 * Re-evaluates every game the device holds anything for.
 *
 * Without this, a save is only ever checked while its own game page is mounted:
 * `applyAuto` ran from `markPlayed` on open and from `commit` on exit, and
 * nothing else. Beat a high score, close the tab, open the achievements page —
 * and nothing had looked at the save since before the score existed. The
 * objective was earned and simply unread.
 *
 * Run at boot and whenever the achievements page opens, so a save written by
 * any route, at any time, is picked up by the next page load.
 */
export function rescanAll(): number {
  const slugs = new Set<string>();

  for (const entry of listSaves()) slugs.add(entry.game.slug);

  // Progress without a save still matters: playtime and session rules live in
  // the same pass, so they were stuck behind the same door.
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PLAY_PREFIX)) slugs.add(key.slice(PLAY_PREFIX.length));
    }
  } catch {
    /* storage blocked — whatever listSaves found is still worth checking */
  }

  for (const slug of slugs) applyAuto(slug);
  return slugs.size;
}

/**
 * Counts one play session. Call the returned function when the player leaves.
 *
 * Only time with the tab actually in front is counted. Wall-clock from open to
 * close would call a game left open overnight an eight-hour session, which is
 * both wrong and visible now that playtime is shown on the achievements page.
 *
 * Time is committed on the way out rather than on the way in, so a mis-click —
 * or React's development double-mount — does not inflate anything.
 */
export function trackPlay(slug: string) {
  let counting = document.visibilityState === 'visible';
  let since = Date.now();
  let active = 0;

  const settle = () => {
    if (counting) active += Date.now() - since;
    since = Date.now();
  };

  const onVisibility = () => {
    settle();
    counting = document.visibilityState === 'visible';
  };

  const commit = () => {
    settle();
    const seconds = Math.round(active / 1000);
    // Reset first: closing a tab fires pagehide and may still unmount, and this
    // is what stops the same stretch of play being counted twice.
    active = 0;
    if (seconds < 5) return;

    const previous = readProgress(slug);
    const progress = { seconds: previous.seconds + seconds, sessions: previous.sessions + 1 };
    write(PROGRESS(slug), progress);
    applyAuto(slug, progress);
  };

  document.addEventListener('visibilitychange', onVisibility);
  // Closing the tab is the common way to stop playing, and it never unmounts.
  window.addEventListener('pagehide', commit);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', commit);
    commit();
  };
}

export function toggleManual(slug: string, id: string) {
  const unlocked = readUnlocked(slug);
  if (!unlocked.delete(id)) unlocked.add(id);
  return save(slug, unlocked);
}

/** Totals for the overview page. */
export const countsFor = (slug: string) => ({
  unlocked: readUnlocked(slug).size,
  total: achievementsFor(slug).length,
});

/**
 * Opens a play session: unlocks `played` immediately and commits time on unmount.
 *
 * Shared so every route that mounts a player records the same thing. When only
 * the achievements panel did this, the bare /embed route recorded nothing at all
 * and playing through the blank-tab launcher counted for zero.
 *
 * Pass null for an unknown slug — the hook no-ops rather than inventing storage.
 */
export function useGameSession(slug: string | null) {
  const [unlocked, setUnlocked] = useState<Set<string>>(() =>
    slug ? readUnlocked(slug) : new Set(),
  );

  useEffect(() => {
    if (!slug) return;
    setUnlocked(new Set(markPlayed(slug)));
    const stop = trackPlay(slug);

    /*
     * Re-check the save while the game is still open.
     *
     * Ruffle writes a SharedObject straight to localStorage the moment the game
     * flushes it, but nothing tells this page that happened: storage events only
     * fire for *other* tabs, so a same-document write is silent. Checking once on
     * mount meant beating your top score and seeing nothing until you left the
     * game and came back — the achievement was already earned and simply unread.
     *
     * Ten seconds is well under how long anyone stares at a score screen, and the
     * work is decoding one small save, so it is cheap enough to leave running.
     */
    const recheck = () => setUnlocked(new Set(applyAuto(slug)));
    const timer = window.setInterval(recheck, 10_000);

    // Leaving the tab is the other moment a game has just written something.
    const onHide = () => document.visibilityState === 'hidden' && recheck();
    document.addEventListener('visibilitychange', onHide);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      recheck(); // one last look before the unmount commits the session
      stop();
    };
  }, [slug]);

  return { unlocked, setUnlocked };
}

/* ---------- moving progress between devices ---------- */

const ACH_PREFIX = 'nexus:ach:';
const PLAY_PREFIX = 'nexus:play:';

/**
 * Achievements and playtime as one file.
 *
 * Save data is deliberately not included — it is far larger, and the Saves page
 * already exports it separately. Someone moving to a new laptop usually wants
 * both, so both are offered rather than one silently carrying the other.
 */
export function exportAchievements(): string {
  const unlocked: Record<string, string[]> = {};
  const playtime: Record<string, Progress> = {};
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(ACH_PREFIX)) unlocked[key.slice(ACH_PREFIX.length)] = read(key, []);
      else if (key.startsWith(PLAY_PREFIX)) {
        playtime[key.slice(PLAY_PREFIX.length)] = read(key, { seconds: 0, sessions: 0 });
      }
    }
  } catch {
    /* nothing readable to export */
  }
  return JSON.stringify({ format: 'nexus-achievements/1', exported: Date.now(), unlocked, playtime }, null, 2);
}

export type MergeResult = { games: number; unlocked: number; seconds: number };

/**
 * Merges a file from another device rather than overwriting.
 *
 * Unlocks are unioned and playtime takes the larger of the two, so importing an
 * older backup can never take away progress this device already has — which is
 * the mistake that makes people afraid to press the button.
 */
export function importAchievements(json: string): MergeResult {
  const parsed = JSON.parse(json) as {
    format?: string;
    unlocked?: Record<string, string[]>;
    playtime?: Record<string, Progress>;
  };
  if (!parsed || typeof parsed !== 'object' || !parsed.format?.startsWith('nexus-achievements/')) {
    throw new Error('Not a Nexus achievements file.');
  }

  const touched = new Set<string>();
  let gained = 0;
  let seconds = 0;

  for (const [slug, ids] of Object.entries(parsed.unlocked ?? {})) {
    if (!Array.isArray(ids)) continue;
    const current = readUnlocked(slug);
    const before = current.size;
    for (const id of ids) if (typeof id === 'string') current.add(id);
    if (current.size !== before) gained += current.size - before;
    save(slug, current);
    touched.add(slug);
  }

  for (const [slug, incoming] of Object.entries(parsed.playtime ?? {})) {
    if (!incoming || typeof incoming !== 'object') continue;
    const mine = readProgress(slug);
    const merged = {
      seconds: Math.max(mine.seconds, Number(incoming.seconds) || 0),
      sessions: Math.max(mine.sessions, Number(incoming.sessions) || 0),
    };
    seconds += Math.max(0, merged.seconds - mine.seconds);
    write(PROGRESS(slug), merged);
    touched.add(slug);
  }

  return { games: touched.size, unlocked: gained, seconds };
}
