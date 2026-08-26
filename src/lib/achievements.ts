import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { SAVE_RULES, passes } from '../data/saveRules';
import { readSavePath } from './saves';

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

  for (const achievement of achievementsFor(slug)) {
    if (achievement.auto && earned(achievement.auto, progress)) unlocked.add(achievement.id);
  }

  for (const [id, rule] of Object.entries(saveDriven(slug))) {
    if (passes(rule, readSavePath(slug, rule.path))) unlocked.add(id);
  }

  return save(slug, unlocked);
}

/** Call when the player opens a game: 'played' should land immediately, not on exit. */
export const markPlayed = (slug: string) => applyAuto(slug);

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
    return trackPlay(slug);
  }, [slug]);

  return { unlocked, setUnlocked };
}
