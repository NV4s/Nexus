import type { SolValue } from '../lib/sol.ts';



export type SaveTest =
  | { atLeast: number }
  | { equals: SolValue }
  | { includes: SolValue }
  | { countAtLeast: number };

export type SaveRule = {

  path: string;

  test?: SaveTest;
};



const madnessArena: Record<string, SaveRule> = {


  'arena-wave-10': { path: 'arenaWaves', test: { atLeast: 10 } },


  'custom-char': { path: 'haveSaved', test: { equals: true } },
  'arena-kills-100': { path: 'arenaKills', test: { atLeast: 100 } },
  'rich': { path: 'myCash', test: { atLeast: 100000 } },

  'story-mission': { path: 'storyProgressWorld0' },
};


const cubefield: Record<string, SaveRule> = {
  'score-5k': { path: 'TopScore', test: { atLeast: 5000 } },
  'score-20k': { path: 'TopScore', test: { atLeast: 20000 } },
  'score-50k': { path: 'TopScore', test: { atLeast: 50000 } },
};


const asteroids: Record<string, SaveRule> = {
  'named': { path: 'playerName' },
};


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


const duckLife3: Record<string, SaveRule> = {
  'run-10': { path: 'runlvl', test: { atLeast: 10 } },
  'climb-10': { path: 'clilvl', test: { atLeast: 10 } },
  'coins-500': { path: 'money', test: { atLeast: 500 } },
  'own-medal': { path: 'a1' },
};



const duckLife4: Record<string, SaveRule> = {
  'run-10': { path: 'duck1rlvl', test: { atLeast: 10 } },
  'race-won': { path: 'race1' },
  'race-10': { path: 'race10' },
  'tournament': { path: 'tourn1' },
  'coins-500': { path: 'coins', test: { atLeast: 500 } },
};


const endlessWar4: Record<string, SaveRule> = {
  'mission-done': { path: 'MISSIONS_COMPLETED', test: { atLeast: 1 } },
  'missions-10': { path: 'MISSIONS_COMPLETED', test: { atLeast: 10 } },
};

const gunMayhem2: Record<string, SaveRule> = {
  'named-fighter': { path: 'p1name' },
  'campaign-5': { path: 'campaign', test: { atLeast: 5 } },
};


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


export function passes(rule: SaveRule, value: SolValue | undefined): boolean {
  if (value === undefined) return false;
  const test = rule.test;
  if (!test) return Boolean(value);
  if ('atLeast' in test) return typeof value === 'number' && value >= test.atLeast;
  if ('equals' in test) return value === test.equals;
  if ('countAtLeast' in test) return Array.isArray(value) && value.length >= test.countAtLeast;
  return Array.isArray(value) && value.includes(test.includes);
}



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
