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
export const SAVE_RULES: Record<string, Record<string, SaveRule>> = {
  // Nothing yet. Entries land here as saves are inspected — see the header.
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
