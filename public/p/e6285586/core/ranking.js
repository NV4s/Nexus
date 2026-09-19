// @ts-check
/**
 * Ranking table, name entry, and achievements.
 *
 * The screens are already drawn in render/screens.js; this is the state behind
 * them. Scores persist to localStorage rather than to a server, because the
 * arcade kept them on the board and a browser has no board — the nearest
 * honest equivalent is the machine you played on.
 *
 * Every localStorage access is wrapped: a private window, cleared site data, or
 * a browser set to block storage all throw on access rather than returning
 * null, and a high-score table is never worth taking the game down for.
 */

const KEY = 'crisis-point.ranking.v1';
const ACH_KEY = 'crisis-point.achievements.v1';
export const TABLE_SIZE = 10;

/** The board a fresh cabinet ships with. */
export function defaultTable() {
  return [
    { name: 'L.O', score: 2500000, stage: 6, accuracy: 0.851, time: 1980 },
    { name: 'MRC', score: 2490000, stage: 6, accuracy: 0.812, time: 2010 },
    { name: 'RBT', score: 2480000, stage: 5, accuracy: 0.803, time: 2040 },
    { name: 'C.R', score: 2470000, stage: 5, accuracy: 0.795, time: 2070 },
    { name: 'WFG', score: 2460000, stage: 4, accuracy: 0.781, time: 2100 },
    { name: 'KTH', score: 2400000, stage: 4, accuracy: 0.762, time: 2130 },
    { name: 'W.D', score: 2350000, stage: 3, accuracy: 0.741, time: 2160 },
    { name: 'VSE', score: 2300000, stage: 3, accuracy: 0.723, time: 2190 },
    { name: 'AAA', score: 2250000, stage: 2, accuracy: 0.700, time: 2220 },
    { name: 'AAA', score: 2200000, stage: 2, accuracy: 0.688, time: 2250 },
  ];
}

/** Read, falling back to the default board on any storage failure. */
export function loadTable(storage = globalThis.localStorage) {
  try {
    const raw = storage && storage.getItem(KEY);
    if (!raw) return defaultTable();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return defaultTable();
    return parsed.slice(0, TABLE_SIZE);
  } catch {
    return defaultTable();
  }
}

export function saveTable(table, storage = globalThis.localStorage) {
  try {
    if (!storage) return false;
    storage.setItem(KEY, JSON.stringify(table.slice(0, TABLE_SIZE)));
    return true;
  } catch {
    // Storage being unavailable must never break the run.
    return false;
  }
}

/** Where a score would land, or -1 if it misses the board. */
export function rankFor(table, score) {
  for (let i = 0; i < table.length; i++) {
    if (score > table[i].score) return i;
  }
  return table.length < TABLE_SIZE ? table.length : -1;
}

export const madeTheBoard = (table, score) => rankFor(table, score) >= 0;

/** Insert an entry, keeping the board sorted and capped. */
export function insertScore(table, entry) {
  const at = rankFor(table, entry.score);
  if (at < 0) return { table, rank: -1 };
  const next = [...table];
  next.splice(at, 0, entry);
  return { table: next.slice(0, TABLE_SIZE), rank: at };
}

/* ------------------------------ name entry ----------------------------- */

export const NAME_LENGTH = 3;
export const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.!?/_<>';

export function createNameEntry(rank, score, seconds = 27) {
  return { rank, score, chars: [], timeLeft: seconds, done: false };
}

export function typeChar(entry, ch) {
  if (entry.done || entry.chars.length >= NAME_LENGTH) return false;
  if (!CHARSET.includes(ch)) return false;
  entry.chars.push(ch);
  return true;
}

export function backspace(entry) {
  if (entry.done || !entry.chars.length) return false;
  entry.chars.pop();
  return true;
}

/** Finish, padding a short name so the board never holds a blank. */
export function confirmName(entry) {
  entry.done = true;
  const name = entry.chars.join('').trim();
  return name.length ? name.padEnd(NAME_LENGTH, ' ').slice(0, NAME_LENGTH) : 'AAA';
}

export function updateNameEntry(entry, dt) {
  if (entry.done) return 'done';
  entry.timeLeft -= dt;
  if (entry.timeLeft <= 0) { entry.timeLeft = 0; return 'timeout'; }
  return 'running';
}

/* ----------------------------- achievements ---------------------------- */

/**
 * Two are named outright in the executable's symbol table; the rest follow the
 * same shape. Each is a predicate over a finished run.
 */
export const ACHIEVEMENTS = {
  hacs:            { name: 'H.A.C.S. DOWN',   test: (r) => r.bossesBeaten.includes('hacs') },
  wildDogQuick:    { name: 'QUICK DRAW',      test: (r) => r.bossTimes.wilddog != null && r.bossTimes.wilddog < 45 },
  allClear:        { name: 'ALL CLEAR',       test: (r) => r.allClear },
  noContinue:      { name: 'NO CONTINUE',     test: (r) => r.allClear && r.continues === 0 },
  sharpshooter:    { name: 'SHARPSHOOTER',    test: (r) => r.accuracy >= 0.9 },
  headhunter:      { name: 'HEADHUNTER',      test: (r) => r.headshots >= 100 },
  chained:         { name: 'CHAIN MASTER',    test: (r) => r.maxLink >= 50 },
  flanker:         { name: 'FLANKER',         test: (r) => r.sideAttacks >= 25 },
  secondRound:     { name: 'SECOND ROUND',    test: (r) => r.round >= 2 },
};

export function earned(run) {
  return Object.entries(ACHIEVEMENTS)
    .filter(([, a]) => { try { return !!a.test(run); } catch { return false; } })
    .map(([id]) => id);
}

export function loadAchievements(storage = globalThis.localStorage) {
  try {
    const raw = storage && storage.getItem(ACH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function unlock(ids, storage = globalThis.localStorage) {
  const have = new Set(loadAchievements(storage));
  const fresh = ids.filter((i) => !have.has(i));
  for (const i of fresh) have.add(i);
  try {
    if (storage) storage.setItem(ACH_KEY, JSON.stringify([...have]));
  } catch { /* storage unavailable; the run still counts */ }
  return fresh;
}

export function selfTest(ok) {
  // A tiny in-memory stand-in for localStorage.
  const mem = (() => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), clear: () => m.clear() };
  })();
  // One that throws on every access, like a browser blocking site data.
  const hostile = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

  const table = defaultTable();
  ok('the default board is full', table.length === TABLE_SIZE);
  ok('the default board is sorted high to low',
    table.every((e, i) => i === 0 || e.score <= table[i - 1].score));
  ok('every default name fits the three-character field',
    table.every((e) => e.name.length <= NAME_LENGTH));

  // Ranking.
  ok('a top score ranks first', rankFor(table, 9999999) === 0);
  ok('a middling score lands mid-table', rankFor(table, 2455000) === 5);
  ok('a low score misses the board', rankFor(table, 100) === -1);
  ok('madeTheBoard agrees with rankFor',
    madeTheBoard(table, 9999999) === true && madeTheBoard(table, 100) === false);
  // Ties do not displace the incumbent — the board is strictly better-than.
  ok('an equal score does not displace an existing entry',
    rankFor(table, table[0].score) !== 0);

  const { table: after, rank } = insertScore(table, { name: 'NEW', score: 9999999, stage: 6, accuracy: 1, time: 100 });
  ok('a qualifying score is inserted at its rank', rank === 0 && after[0].name === 'NEW');
  ok('the board stays capped', after.length === TABLE_SIZE);
  ok('the last entry is pushed off', after[after.length - 1].score === table[TABLE_SIZE - 2].score);
  ok('a missing score changes nothing',
    insertScore(table, { name: 'BAD', score: 1 }).rank === -1);

  // Persistence, and surviving storage that refuses to work.
  ok('saving reports success', saveTable(after, mem) === true);
  ok('a saved board round-trips', loadTable(mem)[0].name === 'NEW');
  ok('an empty store falls back to the default board',
    loadTable({ getItem: () => null }) [0].name === 'L.O');
  ok('corrupt data falls back rather than throwing',
    loadTable({ getItem: () => 'not json' }).length === TABLE_SIZE);
  ok('a store that throws on read falls back', loadTable(hostile).length === TABLE_SIZE);
  ok('a store that throws on write reports failure, not a crash',
    saveTable(after, hostile) === false);
  ok('no storage at all is safe', loadTable(null).length === TABLE_SIZE);

  // Name entry.
  const ne = createNameEntry(1, 2946550);
  ok('name entry starts empty with a clock', ne.chars.length === 0 && ne.timeLeft === 27);
  ok('a valid character is accepted', typeChar(ne, 'A') === true);
  ok('a character outside the set is refused', typeChar(ne, '#') === false);
  typeChar(ne, 'B'); typeChar(ne, 'C');
  ok('the field fills to three characters', ne.chars.join('') === 'ABC');
  ok('a fourth character is refused', typeChar(ne, 'D') === false);
  ok('backspace removes one', backspace(ne) === true && ne.chars.join('') === 'AB');
  ok('confirming pads a short name', confirmName(ne).length === NAME_LENGTH);

  const empty = createNameEntry(2, 100);
  ok('confirming nothing yields the default initials', confirmName(empty) === 'AAA');
  ok('a confirmed entry refuses further input', typeChar(empty, 'A') === false);

  const timed = createNameEntry(1, 100, 1);
  ok('the entry clock runs', updateNameEntry(timed, 0.5) === 'running');
  ok('it times out', updateNameEntry(timed, 0.6) === 'timeout');
  ok('the clock never goes negative', timed.timeLeft === 0);

  // Achievements.
  const run = {
    bossesBeaten: ['hacs', 'wilddog'], bossTimes: { wilddog: 40 },
    allClear: true, continues: 0, accuracy: 0.92, headshots: 120,
    maxLink: 60, sideAttacks: 30, round: 1,
  };
  const got = earned(run);
  ok('the two named achievements are recognised',
    got.includes('hacs') && got.includes('wildDogQuick'));
  ok('a clean clear earns no-continue', got.includes('noContinue'));
  ok('a second round is not claimed on the first', !got.includes('secondRound'));
  ok('a weak run earns little',
    earned({ bossesBeaten: [], bossTimes: {}, allClear: false, continues: 3,
             accuracy: 0.2, headshots: 1, maxLink: 2, sideAttacks: 0, round: 1 }).length === 0);
  ok('a malformed run does not throw', (() => {
    try { earned({}); return true; } catch { return false; }
  })());

  mem.clear();
  ok('unlocking returns only what is new', unlock(['hacs', 'allClear'], mem).length === 2);
  ok('unlocking again returns nothing new', unlock(['hacs'], mem).length === 0);
  ok('unlocked achievements persist', loadAchievements(mem).includes('allClear'));
  ok('unlocking against hostile storage still reports the new ones',
    unlock(['sharpshooter'], hostile).includes('sharpshooter'));
}
