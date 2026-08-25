import { ACHIEVEMENTS } from '../data/achievements';

/**
 * Ruffle runs a SWF as an opaque display object — nothing can read a Flash game's
 * score, level or flags from outside it. So only what the page itself can observe
 * unlocks automatically; every game-specific objective is ticked by the player.
 */
export type AutoRule = 'played' | 'time30' | 'time120' | 'sessions5';

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

export const achievementsFor = (slug: string): Achievement[] => ACHIEVEMENTS[slug] ?? GENERIC;

export const readProgress = (slug: string): Progress => read(PROGRESS(slug), { seconds: 0, sessions: 0 });

export const readUnlocked = (slug: string): Set<string> => new Set(read<string[]>(UNLOCKED(slug), []));

const save = (slug: string, ids: Set<string>) => {
  write(UNLOCKED(slug), [...ids]);
  return ids;
};

const earned = (rule: AutoRule, progress: Progress) =>
  rule === 'played'
    ? true
    : rule === 'time30'
      ? progress.seconds >= 1800
      : rule === 'time120'
        ? progress.seconds >= 7200
        : progress.sessions >= 5;

/** Re-checks every self-unlocking objective against current progress. */
function applyAuto(slug: string, progress = readProgress(slug)) {
  const unlocked = readUnlocked(slug);
  for (const achievement of achievementsFor(slug)) {
    if (achievement.auto && earned(achievement.auto, progress)) unlocked.add(achievement.id);
  }
  return save(slug, unlocked);
}

/** Call when the player opens a game: 'played' should land immediately, not on exit. */
export const markPlayed = (slug: string) => applyAuto(slug);

/**
 * Counts one play session. Call the returned function when the player leaves.
 *
 * Time and session count are committed on the way out rather than on the way in,
 * so a mis-click — or React's development double-mount — does not inflate either.
 */
export function trackPlay(slug: string) {
  const opened = Date.now();
  return () => {
    const seconds = Math.round((Date.now() - opened) / 1000);
    if (seconds < 5) return;

    const previous = readProgress(slug);
    const progress = { seconds: previous.seconds + seconds, sessions: previous.sessions + 1 };
    write(PROGRESS(slug), progress);
    applyAuto(slug, progress);
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
