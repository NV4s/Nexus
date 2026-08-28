import type { SolValue } from '../lib/sol';

/**
 * Achievements that unlock from a game's own save file rather than from playtime.
 *
 * HOW TO ADD A GAME
 * 1. `node scripts/scan-saves.mjs <name>` reads the field names straight out of
 *    the SWF's own bytecode — every `so.data.<field>` it touches.
 * 2. Better still, play it far enough to save, open the Saves page and expand
 *    "Inspect save": that shows the values too, not just the names.
 *
 * **Never invent a path.** A rule that matches nothing fails silently: no error,
 * no warning in production, just an achievement that never unlocks — worse than
 * the honest playtime one it replaced.
 *
 * The two sources are not equally strong, and the difference matters:
 *
 * - A real .sol proves the name, the type and a plausible range. Madness,
 *   Cubefield and Asteroids were checked this way.
 * - The scan proves only that the game reads or writes that name. Thresholds
 *   below are therefore deliberately low, and `passes` is type-checked, so a
 *   field that turns out to hold a string simply never matches rather than
 *   unlocking wrongly.
 *
 * Flags whose polarity is unclear are left out entirely. Endless War 3 stores
 * `LOCK_Vietnam` and friends, and nothing in the bytecode says whether true
 * means locked or unlocked — a rule on those had a one-in-two chance of
 * unlocking everything on a fresh save.
 *
 * Every id used here must already exist in data/achievements.ts. The dev check at
 * the bottom of this file shouts if it does not.
 */

export type SaveTest =
  | { atLeast: number }
  | { equals: SolValue }
  | { includes: SolValue }
  | { countAtLeast: number };

export type SaveRule = {
  /** Dotted path into the decoded save. Numeric segments index arrays. */
  path: string;
  /** Omitted means "this path exists and is truthy". */
  test?: SaveTest;
};

/** slug → achievement id → rule. */
/**
 * Madness: Project Nexus stores its arena run at the top level of the save.
 * The real .sol on hand is named `arenaMadnessGame2` while the SWF's own code
 * calls getLocal("arenaMadnessTest31") — which costs nothing here, because a
 * rule is matched against every save a game holds regardless of its name.
 * Verified against that real save:
 *
 *   haveSaved = true          arenaWaves = 0        arenaKills = 0
 *   currentWave = 1           myCash = 999999999    newArena = true
 *   teamLeader.myLevel = 1    teamLeader.myXP = 0   teamLeader.statPoints = 0
 *
 * The mods are rebuilds of the same engine, so they carry the same fields. A
 * rule is matched against every save the game holds regardless of the object's
 * name, so a mod that renames its SharedObject still works.
 */
const madnessArena: Record<string, SaveRule> = {
  // "Reach wave 10 in Arena mode" — arenaWaves is the count survived, and
  // currentWave is only the run in progress.
  'arena-wave-10': { path: 'arenaWaves', test: { atLeast: 10 } },
  // "Build and save a custom character" — the game writes this once a squad has
  // been saved, which is the same act.
  'custom-char': { path: 'haveSaved', test: { equals: true } },
  'arena-kills-100': { path: 'arenaKills', test: { atLeast: 100 } },
  'rich': { path: 'myCash', test: { atLeast: 100000 } },
  // World 0 is the first story world; finishing anything in it sets this.
  'story-mission': { path: 'storyProgressWorld0' },
};

/**
 * Cubefield keeps its whole save in one number. Verified against a real
 * `cubefield.sol`:
 *
 *   TopScore = 22885
 *
 * The SWF writes `hso.data.TopScore` and flushes it when a run ends, so the
 * tiers are the game's own record of the best run, not a self-report.
 */
const cubefield: Record<string, SaveRule> = {
  'score-5k': { path: 'TopScore', test: { atLeast: 5000 } },
  'score-20k': { path: 'TopScore', test: { atLeast: 20000 } },
  'score-50k': { path: 'TopScore', test: { atLeast: 50000 } },
};

/**
 * Neave's Asteroids saves one field, and it is not the score. Verified against
 * a real `neaveAsteroids.sol`:
 *
 *   playerName = "ALE"
 *
 * The score is missing because the game never kept it locally — it POSTed to
 * neave.com/games/games_score.php, which no longer answers. So there is exactly
 * one thing the save can prove, and it proves it well: the initials are typed
 * on the screen that appears after a run ends, so the field existing means a
 * run was finished. Do not add a score rule here; there is no score to read.
 */
const asteroids: Record<string, SaveRule> = {
  'named': { path: 'playerName' },
};


/* ---------- from scripts/scan-saves.mjs ---------- */

/**
 * Duck Life 1-3 keep every stat as a top-level number in `mydata`, one per
 * discipline, plus coins. Level 10 is early enough to be a real milestone in
 * all three without depending on where each game caps out.
 */
const duckLife: Record<string, SaveRule> = {
  'run-10': { path: 'runlvl', test: { atLeast: 10 } },
  'swim-10': { path: 'swilvl', test: { atLeast: 10 } },
  'fly-10': { path: 'flylvl', test: { atLeast: 10 } },
  'coins-500': { path: 'money', test: { atLeast: 500 } },
};

const duckLife2: Record<string, SaveRule> = {
  'named': { path: 'namee' },
  'run-10': { path: 'runlvl', test: { atLeast: 10 } },
  'climb-10': { path: 'clilvl', test: { atLeast: 10 } },
  'coins-500': { path: 'money', test: { atLeast: 500 } },
};

// a1…a10 are the game's own award flags, stored beside the stats.
const duckLife3: Record<string, SaveRule> = {
  'run-10': { path: 'runlvl', test: { atLeast: 10 } },
  'climb-10': { path: 'clilvl', test: { atLeast: 10 } },
  'coins-500': { path: 'money', test: { atLeast: 500 } },
  'own-medal': { path: 'a1' },
};

// Duck Life 4 holds six ducks, so its stats are prefixed per duck, and it
// records each race and tournament as its own flag.
const duckLife4: Record<string, SaveRule> = {
  'run-10': { path: 'duck1rlvl', test: { atLeast: 10 } },
  'race-won': { path: 'race1' },
  'race-10': { path: 'race10' },
  'tournament': { path: 'tourn1' },
  'coins-500': { path: 'coins', test: { atLeast: 500 } },
};

/** The only Endless War that counts missions rather than just settings. */
const endlessWar4: Record<string, SaveRule> = {
  'mission-done': { path: 'MISSIONS_COMPLETED', test: { atLeast: 1 } },
  'missions-10': { path: 'MISSIONS_COMPLETED', test: { atLeast: 10 } },
};

const gunMayhem2: Record<string, SaveRule> = {
  'named-fighter': { path: 'p1name' },
  'campaign-5': { path: 'campaign', test: { atLeast: 5 } },
};

/**
 * Warfare 1917 keeps a full career record — every one of these is a running
 * total the game itself maintains, which makes it the best-served game here.
 */
const warfare1917: Record<string, SaveRule> = {
  'morale-win': { path: 'career_moraleWins', test: { atLeast: 1 } },
  'ground-win': { path: 'career_conquerWins', test: { atLeast: 1 } },
  'tank': { path: 'career_tankDeployed', test: { atLeast: 1 } },
  'kills-100': { path: 'career_soldiersKilled', test: { atLeast: 100 } },
  'trenches-10': { path: 'career_trenchesTaken', test: { atLeast: 10 } },
  'rank-5': { path: 'experienceLevel', test: { atLeast: 5 } },
};

export const SAVE_RULES: Record<string, Record<string, SaveRule>> = {
  cubefield,
  asteroids,
  'duck-life': duckLife,
  'duck-life-2': duckLife2,
  'duck-life-3': duckLife3,
  'duck-life-4': duckLife4,
  'endless-war-4': endlessWar4,
  'gun-mayhem-2': gunMayhem2,
  'warfare-1917': warfare1917,
  'madness-project-nexus-classic': madnessArena,
  'madness-project-nexus-classic-redux': madnessArena,
  'madness-project-nexus-mod-v9-5': madnessArena,
  'madness-project-nexus-mod-v7': madnessArena,
  'madness-project-nexus-mod-v6-1': madnessArena,
  'madness-project-nexus-modded': madnessArena,
  'madness-project-nexus-nexus-mod': madnessArena,
  'madness-project-nexus-recompiled': madnessArena,
  'madness-project-nexus-goofy-ahh-mod': madnessArena,
  'madness-project-nexus-n-a-f-mod': madnessArena,
  'madness-project-nexus-story-expansion-reborn': madnessArena,
  'madness-project-nexus-tou-reborn-v1': madnessArena,
};

/** Total by construction: every branch returns a boolean, so it cannot throw. */
export function passes(rule: SaveRule, value: SolValue | undefined): boolean {
  if (value === undefined) return false;
  const test = rule.test;
  if (!test) return Boolean(value);
  if ('atLeast' in test) return typeof value === 'number' && value >= test.atLeast;
  if ('equals' in test) return value === test.equals;
  if ('countAtLeast' in test) return Array.isArray(value) && value.length >= test.countAtLeast;
  return Array.isArray(value) && value.includes(test.includes);
}

// A rule pointing at an achievement that does not exist can never unlock anything
// and says nothing when it fails, so say it here instead.
if (import.meta.env?.DEV) {
  import('./achievements').then(({ ACHIEVEMENTS }) => {
    for (const [slug, rules] of Object.entries(SAVE_RULES)) {
      const ids = new Set((ACHIEVEMENTS[slug] ?? []).map((achievement) => achievement.id));
      const unknown = Object.keys(rules).filter((id) => !ids.has(id));
      if (!ACHIEVEMENTS[slug]) console.warn(`saveRules: ${slug} has no achievements`);
      else if (unknown.length) console.warn(`saveRules: ${slug} has no ${unknown.join(', ')}`);
    }
  });
}
