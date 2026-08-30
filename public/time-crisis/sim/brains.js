// @ts-check
/**
 * Enemy decision tables.
 *
 * The arcade ran an HTN planner (TCAIBrain_*, TCAIPln_*, TCAIAct_*). That is
 * not reproducible from the outside and, more to the point, is not observable
 * from the outside either — what a player perceives is "how often does this
 * thing shoot, does it duck between shots, does staggering it buy me time".
 * So each recovered brain becomes a weighted action table with preconditions.
 *
 * ponytail: weighted action selection, not a real HTN planner. Upgrade only if
 * enemies visibly fail to coordinate, which needs squad state they don't have.
 *
 * An action is chosen whenever an enemy finishes what it was doing. Weights are
 * relative within a brain; preconditions cull impossible choices first.
 */

import { rng } from '../core/rng.js';

/**
 * @typedef {{
 *   weights: Record<string, number>,
 *   burst: [number, number],
 *   cooldown: [number, number],
 *   covers: boolean,
 *   advances?: boolean,
 *   suppresses?: boolean,
 * }} Brain
 */

/** @type {Record<string, Brain>} */
export const BRAINS = {
  /** Line infantry. Ducks between shots, occasionally repositions. */
  soldier: {
    weights: { aim: 6, hide: 3, lean: 2, reposition: 1 },
    burst: [1, 1], cooldown: [1.4, 3.0], covers: true,
  },

  /** Better trained: shoots more, hides less, leans to get an angle. */
  elite: {
    weights: { aim: 9, hide: 2, lean: 3, reposition: 2 },
    burst: [1, 2], cooldown: [1.0, 2.2], covers: true,
  },

  /** Presses forward and fires. What the crisis shooters run on. */
  attacker: {
    weights: { aim: 10, advance: 4, hide: 1 },
    burst: [1, 2], cooldown: [0.8, 1.8], covers: false, advances: true,
  },

  /** Walks its shield forward. Rarely hides — the shield is the cover. */
  shield: {
    weights: { aim: 5, advance: 5, lean: 1 },
    burst: [1, 1], cooldown: [1.6, 2.8], covers: false, advances: true,
  },

  /** Emplacement. Never moves, fires long suppressing bursts. */
  heavyGun: {
    weights: { aim: 12, hide: 1 },
    burst: [3, 6], cooldown: [1.8, 3.2], covers: false, suppresses: true,
  },

  /** Drugged. No self-preservation at all; walks straight at you. */
  trance: {
    weights: { aim: 6, advance: 9 },
    burst: [1, 1], cooldown: [0.9, 1.6], covers: false, advances: true,
  },

  /** Drone. Drifts, strafes, fires in short bursts. */
  bit: {
    weights: { aim: 7, strafe: 5 },
    burst: [1, 3], cooldown: [1.0, 2.0], covers: false,
  },

  /** Props and markers: never act. */
  none: {
    weights: {}, burst: [0, 0], cooldown: [999, 999], covers: false,
  },
};

/**
 * Pick the next action for an enemy.
 * `ctx` supplies the preconditions the tables cannot know themselves.
 * Returns an action name, or 'wait' if nothing is currently legal.
 */
export function chooseAction(brainName, ctx) {
  const brain = BRAINS[brainName] || BRAINS.none;
  const names = [];
  const weights = [];

  for (const [action, weight] of Object.entries(brain.weights)) {
    if (!weight) continue;
    // Preconditions. An action that cannot be performed is never chosen, rather
    // than being chosen and then silently failing — the second kind produces
    // enemies that stand around looking broken.
    if (action === 'aim' && !ctx.canSeePlayer) continue;
    if (action === 'hide' && (!brain.covers || ctx.inCover)) continue;
    if (action === 'lean' && (!ctx.inCover || !ctx.canSeePlayer)) continue;
    if (action === 'advance' && !ctx.canAdvance) continue;
    if (action === 'reposition' && !ctx.canReposition) continue;
    if (action === 'strafe' && !ctx.canStrafe) continue;
    names.push(action);
    weights.push(weight);
  }

  if (!names.length) return 'wait';
  return rng.game.weighted(names, weights);
}

export function burstCount(brainName) {
  const b = BRAINS[brainName] || BRAINS.none;
  return rng.game.int(b.burst[0], b.burst[1]);
}

export function cooldown(brainName) {
  const b = BRAINS[brainName] || BRAINS.none;
  return rng.game.range(b.cooldown[0], b.cooldown[1]);
}

export const brainOf = (name) => BRAINS[name] || BRAINS.none;

export function selfTest(ok) {
  const names = Object.keys(BRAINS);
  ok('all seven recovered brains plus a null brain exist', names.length === 8);
  ok('every brain declares burst, cooldown and cover policy',
    names.every((n) => {
      const b = BRAINS[n];
      return Array.isArray(b.burst) && Array.isArray(b.cooldown) && typeof b.covers === 'boolean';
    }));
  ok('cooldown ranges are ordered low to high',
    names.every((n) => BRAINS[n].cooldown[0] <= BRAINS[n].cooldown[1]));

  rng.reseedAll(11);
  const full = { canSeePlayer: true, inCover: true, canAdvance: true, canReposition: true, canStrafe: true };

  // An enemy that cannot see you must never decide to aim at you.
  const blind = { ...full, canSeePlayer: false };
  ok('a blind enemy never chooses to aim', (() => {
    for (let i = 0; i < 200; i++) if (chooseAction('soldier', blind) === 'aim') return false;
    return true;
  })());

  // Brains that do not use cover must never try to hide.
  ok('non-covering brains never hide', (() => {
    for (let i = 0; i < 200; i++) if (chooseAction('trance', full) === 'hide') return false;
    return true;
  })());

  ok('an enemy already in cover does not hide again', (() => {
    for (let i = 0; i < 200; i++) if (chooseAction('soldier', full) === 'hide') return false;
    return true;
  })());

  ok('an exposed soldier can choose to hide', (() => {
    const exposed = { ...full, inCover: false };
    for (let i = 0; i < 400; i++) if (chooseAction('soldier', exposed) === 'hide') return true;
    return false;
  })());

  ok('the null brain always waits', chooseAction('none', full) === 'wait');
  ok('an unknown brain falls back to waiting', chooseAction('nonsense', full) === 'wait');
  ok('an enemy with no legal action waits',
    chooseAction('heavyGun', { canSeePlayer: false, inCover: false }) === 'wait');

  ok('emplacements fire longer bursts than infantry',
    BRAINS.heavyGun.burst[1] > BRAINS.soldier.burst[1]);
  ok('the drugged tier prefers advancing over shooting',
    BRAINS.trance.weights.advance > BRAINS.trance.weights.aim);
  ok('elites shoot more readily than line infantry',
    BRAINS.elite.weights.aim > BRAINS.soldier.weights.aim);

  rng.reseedAll(4);
  const a = burstCount('elite'), c = cooldown('elite');
  rng.reseedAll(4);
  ok('brain draws are reproducible from a seed',
    burstCount('elite') === a && cooldown('elite') === c);
  ok('burst counts stay inside the declared range',
    a >= BRAINS.elite.burst[0] && a <= BRAINS.elite.burst[1]);
}
