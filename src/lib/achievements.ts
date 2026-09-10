import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../data/achievements.ts';
import { SAVE_RULES, passes } from '../data/saveRules.ts';
import { listSaves, readSavePath, saveRawFor } from './saves.ts';


export type AutoRule = 'played' | 'time30' | 'time120' | 'sessions5' | 'saved' | 'save-changed';

export type Achievement = {
  id: string;
  name: string;
  hint: string;

  auto?: AutoRule;
};

export type Progress = { seconds: number; sessions: number };

const UNLOCKED = (slug: string) => `nexus:ach:${slug}`;
const PROGRESS = (slug: string) => `nexus:play:${slug}`;


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
  } catch {}
}


const GENERIC: Achievement[] = [
  { id: 'played', name: 'First run', hint: 'Open the game.', auto: 'played' },
  { id: 'time30', name: 'Settled in', hint: 'Play for 30 minutes in total.', auto: 'time30' },
  { id: 'sessions5', name: 'Regular', hint: 'Come back for five separate sessions.', auto: 'sessions5' },
];


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


function fingerprint(text: string) {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) | 0;
  return `${text.length}:${value}`;
}

type SaveFacts = { exists: boolean; changed: boolean };


function saveFacts(slug: string): SaveFacts {
  const raw = saveRawFor(slug);
  if (raw === null) return { exists: false, changed: false };

  const current = fingerprint(raw);
  let previous: string | null = null;
  try {
    previous = localStorage.getItem(SIGNATURE(slug));
    if (previous !== current) localStorage.setItem(SIGNATURE(slug), current);
  } catch {}


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


export const saveDriven = (slug: string) => SAVE_RULES[slug] ?? {};


function applyAuto(slug: string, progress = readProgress(slug)) {
  const unlocked = readUnlocked(slug);


  const saves = saveFacts(slug);

  for (const achievement of achievementsFor(slug)) {
    if (achievement.auto && earned(achievement.auto, progress, saves)) unlocked.add(achievement.id);
  }

  for (const [id, rule] of Object.entries(saveDriven(slug))) {
    if (passes(rule, readSavePath(slug, rule.path))) unlocked.add(id);
  }

  return save(slug, unlocked);
}


export const markPlayed = (slug: string) => applyAuto(slug);


export function rescanAll(): number {
  const slugs = new Set<string>();

  for (const entry of listSaves()) slugs.add(entry.game.slug);



  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PLAY_PREFIX)) slugs.add(key.slice(PLAY_PREFIX.length));
    }
  } catch {}

  for (const slug of slugs) applyAuto(slug);
  return slugs.size;
}


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


    active = 0;
    if (seconds < 5) return;

    const previous = readProgress(slug);
    const progress = { seconds: previous.seconds + seconds, sessions: previous.sessions + 1 };
    write(PROGRESS(slug), progress);
    applyAuto(slug, progress);
  };

  document.addEventListener('visibilitychange', onVisibility);

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


export const countsFor = (slug: string) => ({
  unlocked: readUnlocked(slug).size,
  total: achievementsFor(slug).length,
});


export function useGameSession(slug: string | null) {
  const [unlocked, setUnlocked] = useState<Set<string>>(() =>
    slug ? readUnlocked(slug) : new Set(),
  );

  useEffect(() => {
    if (!slug) return;
    setUnlocked(new Set(markPlayed(slug)));
    const stop = trackPlay(slug);


    const recheck = () => setUnlocked(new Set(applyAuto(slug)));
    const timer = window.setInterval(recheck, 10_000);


    const onHide = () => document.visibilityState === 'hidden' && recheck();
    document.addEventListener('visibilitychange', onHide);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      recheck();
      stop();
    };
  }, [slug]);

  return { unlocked, setUnlocked };
}

const ACH_PREFIX = 'nexus:ach:';
const PLAY_PREFIX = 'nexus:play:';


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
  } catch {}
  return JSON.stringify({ format: 'nexus-achievements/1', exported: Date.now(), unlocked, playtime }, null, 2);
}

export type MergeResult = { games: number; unlocked: number; seconds: number };


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
