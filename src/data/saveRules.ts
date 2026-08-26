import type { SolValue } from '../lib/sol';

/**
 * Achievements that unlock from a game's own save file rather than from playtime.
 *
 * HOW TO ADD A GAME
 * 1. Play it far enough to save.
 * 2. Open the Saves page and expand "Inspect save".
 * 3. Copy the path you want and write one entry below.
 *
 * The paths the inspector prints are exactly the paths a rule takes, so there is
 * no reverse-engineering step. **Do not add an entry without having seen the
 * dump** — a rule that matches nothing fails silently: no error, no warning in
 * production, just an achievement that never unlocks, which is worse than the
 * honest playtime one it replaced.
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
 * Madness: Project Nexus stores its arena run at the top level of the save, in
 * a SharedObject named `arenaMadnessGame2`. Verified against a real one:
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
};

export const SAVE_RULES: Record<string, Record<string, SaveRule>> = {
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
