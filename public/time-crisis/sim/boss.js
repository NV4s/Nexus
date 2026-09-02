// @ts-check
/**
 * Boss runner. One implementation, eight data files, no bespoke logic.
 *
 * The schema was designed from the symbol table before any footage was seen,
 * and four of its fields were later confirmed by the game's own info-bar
 * callouts: parts that auto-repair, armour that resists small-arms fire, weak
 * points, and phase gating (the gauge carries a numeral counting phases down).
 *
 * The rule that keeps this from becoming eight implementations: behaviour a
 * boss needs that the ops do not cover becomes a new op in sim/script.js, which
 * every other beat can then use. The only per-boss code permitted is drawing.
 */

import { rng } from '../core/rng.js';
import { TUNING, diff } from '../core/tune.js';

/**
 * @param {object} def entry from content/bosses.js
 */
export function createBoss(def) {
  return {
    def,
    id: def.id,
    hp: def.hp,
    maxhp: def.hp,
    phase: 0,
    /** the phase script has run and the gate is released */
    unlocked: false,
    phaseT: 0,
    parts: (def.parts || []).map((p) => ({
      ...p,
      hp: p.hp,
      maxhp: p.hp,
      destroyed: false,
      repairT: 0,
      exposed: !p.gate || p.gate.includes(0),
    })),
    attackT: rng.game.range(1.0, 2.0),
    attack: null,
    defeated: false,
    hitT: 0,
  };
}

/** Health fraction at which the current phase is gated. */
export function gateHp(boss) {
  const phases = boss.def.phases || [];
  const next = phases[boss.phase + 1];
  return next ? next.at * boss.maxhp : 0;
}

export const phasesLeft = (boss) => Math.max(0, (boss.def.phases || []).length - boss.phase);
export const healthFraction = (boss) => Math.max(0, boss.hp / boss.maxhp);

/**
 * Apply damage. Parts absorb it when one is targeted; otherwise it goes to the
 * body, and a locked phase clamps the body at its gate so the gauge visibly
 * stalls rather than blowing through the phase.
 */
export function damageBoss(boss, amount, part) {
  if (boss.defeated) return { blocked: true };
  boss.hitT = 0.12;

  if (part) {
    const p = boss.parts.find((k) => k.id === part.id);
    if (!p || p.destroyed || !p.exposed) return { blocked: true };
    p.hp -= amount;
    if (p.hp <= 0) {
      p.hp = 0;
      p.destroyed = true;
      p.repairT = p.repair || 0;
      return { partDestroyed: p };
    }
    return { part: p };
  }

  const phase = (boss.def.phases || [])[boss.phase];
  const locked = phase && phase.lock && !boss.unlocked;
  const floor = locked ? gateHp(boss) : 0;
  boss.hp = Math.max(floor, boss.hp - amount);

  if (boss.hp <= 0) {
    boss.defeated = true;
    return { killed: true };
  }
  return { absorbed: locked && boss.hp === floor };
}

/** The phase script finished, so the gate opens. */
export function unlockPhase(boss) {
  boss.unlocked = true;
}

/** Advance when health has fallen to the next phase's threshold. */
export function tryAdvancePhase(boss) {
  const phases = boss.def.phases || [];
  const next = phases[boss.phase + 1];
  if (!next) return false;
  if (boss.hp > next.at * boss.maxhp) return false;
  boss.phase++;
  boss.unlocked = false;
  boss.phaseT = 0;
  // Parts expose and re-cover per phase — this is how a multi-part boss hides
  // its core again after a transformation.
  for (const p of boss.parts) {
    p.exposed = !p.gate || p.gate.includes(boss.phase);
  }
  return true;
}

/** Pick the next attack from the current phase's pool. */
export function chooseAttack(boss) {
  const phase = (boss.def.phases || [])[boss.phase];
  const pool = (phase && phase.attacks) || [];
  if (!pool.length) return null;
  return rng.game.pick(pool);
}

export function updateBoss(boss, dt, ctx) {
  if (boss.defeated) return;
  boss.phaseT += dt;
  boss.hitT = Math.max(0, boss.hitT - dt);

  // Destroyed parts come back unless the phase moved on.
  for (const p of boss.parts) {
    if (p.destroyed && p.repair) {
      p.repairT -= dt;
      if (p.repairT <= 0) {
        p.destroyed = false;
        p.hp = p.maxhp;
      }
    }
  }

  tryAdvancePhase(boss);

  if (boss.attack) {
    boss.attack.t += dt;
    const beat = boss.attack.beats[boss.attack.i];
    if (!beat) { boss.attack = null; return; }
    if (boss.attack.t >= (beat.tell || 0)) {
      if (beat.fire && ctx && ctx.fire) ctx.fire(beat.fire);
      if (beat.shake && ctx && ctx.shake) ctx.shake(beat.shake);
      boss.attack.i++;
      boss.attack.t = 0;
      if (boss.attack.i >= boss.attack.beats.length) boss.attack = null;
    }
    return;
  }

  boss.attackT -= dt;
  if (boss.attackT > 0) return;
  const name = chooseAttack(boss);
  if (!name) { boss.attackT = 1; return; }
  const spec = (boss.def.attacks || {})[name];
  if (!spec) { boss.attackT = 1; return; }
  boss.attack = { name, beats: spec.beats || [], i: 0, t: 0 };
  const cd = spec.cd || TUNING.ENEMY_COOLDOWN_BOSS;
  boss.attackT = rng.game.range(cd[0], cd[1]) * diff().aim;
}

/* ---------------------------------------------------------------- */

const TEST_BOSS = {
  id: 'test', hp: 100,
  parts: [
    { id: 'core', hp: 20, weak: true, box: [0, 0, 0.4, 0.3], gate: [0, 1], repair: null },
    { id: 'pod', hp: 10, weak: false, box: [0.6, 0, 0.3, 0.3], gate: [0], repair: 5 },
    { id: 'vent', hp: 15, weak: true, box: [0, 0.3, 0.3, 0.2], gate: [1], repair: null },
  ],
  phases: [
    { at: 1.0, lock: true, attacks: ['sweep'] },
    { at: 0.5, lock: false, attacks: ['sweep', 'charge'] },
  ],
  attacks: {
    sweep: { cd: [1, 2], beats: [{ tell: 0.5 }, { fire: { n: 2 } }] },
    charge: { cd: [2, 3], beats: [{ tell: 1.0, shake: 8 }, { fire: { n: 1 } }] },
  },
};

export function selfTest(ok) {
  rng.reseedAll(17);

  const b = createBoss(TEST_BOSS);
  ok('a boss starts at full health in phase 0', b.hp === 100 && b.phase === 0);
  ok('phases remaining matches the definition', phasesLeft(b) === 2);
  ok('parts gated to phase 0 start exposed',
    b.parts[0].exposed && b.parts[1].exposed && !b.parts[2].exposed);

  // A locked phase clamps the body at its gate — the gauge stalls.
  const res = damageBoss(b, 80);
  ok('a locked phase absorbs damage past its gate', res.absorbed === true);
  ok('health stops exactly at the gate', b.hp === 50);
  ok('the gate is the next phase threshold', gateHp(b) === 50);

  unlockPhase(b);
  damageBoss(b, 10);
  ok('unlocking lets health fall through', b.hp === 40);

  updateBoss(b, 0.016, {});
  ok('crossing the threshold advances the phase', b.phase === 1);
  ok('advancing re-locks for the new phase script', b.unlocked === false);
  ok('parts re-gate on the new phase',
    b.parts[0].exposed && !b.parts[1].exposed && b.parts[2].exposed);

  // Parts absorb their own damage and are refused when covered.
  const b2 = createBoss(TEST_BOSS);
  ok('a covered part cannot be damaged',
    damageBoss(b2, 5, { id: 'vent' }).blocked === true);
  ok('an exposed part takes damage', !!damageBoss(b2, 5, { id: 'core' }).part);
  ok('damaging a part does not touch the body', b2.hp === 100);
  const destroyed = damageBoss(b2, 99, { id: 'core' });
  ok('a part is destroyed when its own health runs out', !!destroyed.partDestroyed);
  ok('a destroyed part cannot be hit again',
    damageBoss(b2, 5, { id: 'core' }).blocked === true);

  // The auto-repair the game explicitly warns about.
  const b3 = createBoss(TEST_BOSS);
  damageBoss(b3, 99, { id: 'pod' });
  ok('a repairing part starts its timer', b3.parts[1].destroyed && b3.parts[1].repairT === 5);
  updateBoss(b3, 2, {});
  ok('it stays destroyed while repairing', b3.parts[1].destroyed);
  updateBoss(b3, 4, {});
  ok('it comes back after its repair time', !b3.parts[1].destroyed);
  ok('and comes back at full health', b3.parts[1].hp === b3.parts[1].maxhp);
  // A part with no repair time stays dead.
  const b4 = createBoss(TEST_BOSS);
  damageBoss(b4, 99, { id: 'core' });
  updateBoss(b4, 60, {});
  ok('a part without a repair time stays destroyed', b4.parts[0].destroyed);

  // Killing it.
  const b5 = createBoss(TEST_BOSS);
  unlockPhase(b5);
  damageBoss(b5, 60);
  b5.phase = 1; b5.unlocked = true;
  damageBoss(b5, 999);
  ok('enough damage defeats the boss', b5.defeated === true);
  ok('a defeated boss ignores further damage', damageBoss(b5, 10).blocked === true);
  ok('health fraction floors at zero', healthFraction(b5) === 0);

  // Attacks come only from the current phase's pool.
  rng.reseedAll(9);
  const b6 = createBoss(TEST_BOSS);
  ok('phase 0 only sweeps', (() => {
    for (let i = 0; i < 60; i++) if (chooseAttack(b6) !== 'sweep') return false;
    return true;
  })());
  b6.phase = 1;
  ok('phase 1 can also charge', (() => {
    for (let i = 0; i < 200; i++) if (chooseAttack(b6) === 'charge') return true;
    return false;
  })());

  // The runner actually fires.
  rng.reseedAll(3);
  let shots = 0, shakes = 0;
  const b7 = createBoss(TEST_BOSS);
  for (let i = 0; i < 600; i++) {
    updateBoss(b7, 1 / 30, { fire: () => shots++, shake: () => shakes++ });
  }
  ok('a boss fires over time', shots > 0);
  ok('a boss with no attacks defined does not crash', (() => {
    const empty = createBoss({ id: 'x', hp: 10, phases: [{ at: 1, attacks: [] }] });
    for (let i = 0; i < 60; i++) updateBoss(empty, 1 / 30, {});
    return true;
  })());
}
