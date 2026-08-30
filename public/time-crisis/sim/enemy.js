// @ts-check
/**
 * Enemy instances and their update cycle.
 *
 * State machine, mirroring the recovered TCAIAct_* action names:
 *   entering -> ready -> aiming -> (fires) -> ready ...
 *   any -> flinch -> ready        (a hit that beats the flinch roll)
 *   any -> dead
 *
 * The rule that makes the cover graph matter: an enemy only acts on you while
 * you are in a slot that can see it. Out of view it still thinks, but slowly,
 * so swinging back around finds it waiting rather than having cycled through
 * its whole routine off-screen.
 */

import { rng } from '../core/rng.js';
import { TC, TUNING, diff } from '../core/tune.js';
import { ENEMIES } from '../content/enemies.js';
import { chooseAction, burstCount, cooldown, brainOf } from './brains.js';

let nextId = 1;
export const resetIds = () => { nextId = 1; };

/**
 * @param {string} kind archetype key in ENEMIES
 * @param {string} group spawn group id from the route
 * @param {{x:number,z:number,h?:number}} point spawn point
 * @param {string} slot which cover slot this enemy is positioned against
 */
export function spawnEnemy(kind, group, point, slot, opts = {}) {
  const def = ENEMIES[kind];
  if (!def) throw new Error('unknown enemy archetype: ' + kind);
  return {
    id: nextId++,
    kind, def, group, slot,
    wx: point.x,
    z: point.z,
    height: point.h || 0,
    hp: def.hp,
    maxhp: def.hp,
    shield: def.shield ? def.shield.hp : 0,
    shieldMax: def.shield ? def.shield.hp : 0,
    state: 'entering',
    t: 0,
    aimT: 0,
    aimDur: 0,
    burst: 0,
    cool: rng.game.range(0.3, 1.4),
    flinchT: 0,
    hitT: 0,
    dead: false,
    deadT: 0,
    /** marked ammo carrier — "Shoot this enemy!" */
    carries: opts.carries ?? null,
    /** flagged by a CAUTION beat as a Side Attack target */
    flanked: false,
    inCover: brainOf(def.brain).covers,
    bob: rng.visual.range(0, Math.PI * 2),
    fired: 0,
  };
}

/** Total damage a shot does to this enemy, after armor and shields. */
export function resolveDamage(e, dmg, hit) {
  const def = e.def;

  // A front shield eats everything until it breaks — unless you came round the
  // side, which is exactly what the Side Attack bonus rewards.
  if (e.shield > 0 && hit.zone !== 'flank') {
    const absorbed = Math.min(e.shield, dmg);
    e.shield -= absorbed;
    return { toShield: absorbed, toBody: 0, broke: e.shield <= 0 };
  }

  let d = dmg;
  if (hit.zone === 'head') {
    d *= TC.HEADSHOT_MULT;             // recovered constant; ignores armor
  } else {
    if (def.headOnly) d *= 0.15;       // the drugged tier shrugs off body shots
    d *= 1 - (def.armor || 0);
  }
  return { toShield: 0, toBody: d, broke: false };
}

/** Roll whether a hit interrupts what the enemy was doing. */
export function rollFlinch(e) {
  const f = e.def.flinch;
  if (!f) return false;
  if (e.state === 'flinch') return false;
  return rng.game.chance(f.rate);
}

export function applyFlinch(e) {
  const f = e.def.flinch;
  if (!f) return;
  e.state = 'flinch';
  e.flinchT = f.wait;
  e.aimT = 0;
  e.burst = 0;
}

export function killEnemy(e) {
  e.dead = true;
  e.deadT = 0;
  e.state = 'dead';
}

/**
 * One frame for one enemy.
 * `ctx.canSee` is whether the player's current slot can engage this enemy.
 * `fire(e, red)` is called when a shot leaves the muzzle.
 * Returns nothing; mutates the enemy.
 */
export function updateEnemy(e, dt, ctx) {
  e.t += dt;
  e.hitT = Math.max(0, e.hitT - dt);

  if (e.dead) { e.deadT += dt; return; }
  if (e.def.passive) return;

  const engaged = ctx.canSee && ctx.playerExposed;
  const rate = engaged ? 1 : TUNING.UNSEEN_THINK_RATE;

  if (e.state === 'entering') {
    if (e.t > 0.55) { e.state = 'ready'; e.t = 0; }
    return;
  }

  if (e.state === 'flinch') {
    e.flinchT -= dt;
    if (e.flinchT <= 0) { e.state = 'ready'; e.cool = cooldown(e.def.brain) * 0.5; }
    return;
  }

  if (e.state === 'ready') {
    e.cool -= dt * rate;
    if (e.cool > 0) return;

    const action = chooseAction(e.def.brain, {
      canSeePlayer: engaged,
      inCover: e.inCover,
      canAdvance: !e.def.static && !!e.def.rush || (brainOf(e.def.brain).advances && !e.def.static),
      canReposition: !e.def.static,
      canStrafe: !!e.def.flying,
    });

    switch (action) {
      case 'aim': {
        e.state = 'aiming';
        e.aimT = 0;
        e.inCover = false;
        // Crisis shooters telegraph only for RedBulletShotWaitTime plus a beat;
        // everyone else uses their archetype's aim time, scaled by difficulty.
        e.aimDur = e.def.red
          ? TC.RED_SHOT_WAIT + 0.55 * diff().aim
          : e.def.aim * diff().aim;
        e.burst = burstCount(e.def.brain);
        break;
      }
      case 'hide':
        e.inCover = true;
        e.cool = cooldown(e.def.brain) * 0.6;
        break;
      case 'lean':
        e.inCover = false;
        e.cool = rng.game.range(0.2, 0.5);
        break;
      case 'advance':
        e.z = Math.max(4, e.z - rng.game.range(1.5, 3.5));
        e.cool = rng.game.range(0.5, 1.1);
        break;
      case 'reposition':
        e.wx += rng.game.range(-0.5, 0.5);
        e.cool = rng.game.range(0.6, 1.4);
        break;
      case 'strafe':
        e.wx += rng.game.range(-0.8, 0.8);
        e.height = Math.max(0, e.height + rng.game.range(-0.4, 0.4));
        e.cool = rng.game.range(0.4, 0.9);
        break;
      default:
        e.cool = rng.game.range(0.3, 0.8);
    }
    return;
  }

  if (e.state === 'aiming') {
    e.aimT += dt;
    if (e.aimT < e.aimDur) return;

    const red = !!e.def.red && rng.game.chance(Math.min(1, diff().red));
    ctx.fire(e, red);
    e.fired++;
    e.burst--;

    if (e.burst > 0) {
      e.aimT = e.aimDur - Math.max(0.08, 0.16 - 0.02 * e.burst);
    } else {
      e.state = 'ready';
      e.cool = cooldown(e.def.brain);
      if (brainOf(e.def.brain).covers) e.inCover = true;
    }
  }
}

export function selfTest(ok) {
  rng.reseedAll(21);
  const pt = { x: 0, z: 20 };

  const e = spawnEnemy('soldierBlue', 'g0', pt, 'L0');
  ok('a spawned enemy starts entering with full hp', e.state === 'entering' && e.hp === 1);
  ok('spawn records its group and slot', e.group === 'g0' && e.slot === 'L0');
  ok('unknown archetypes throw rather than spawning a blank',
    (() => { try { spawnEnemy('nope', 'g', pt, 'L0'); return false; } catch { return true; } })());

  // Headshots use the recovered multiplier and ignore armor entirely.
  const heavy = spawnEnemy('soldierBlack', 'g0', pt, 'L0');
  const head = resolveDamage(heavy, 1, { zone: 'head' });
  ok('a headshot applies the x20 multiplier', head.toBody === 20);
  const body = resolveDamage(heavy, 1, { zone: 'body' });
  ok('armor reduces body damage', Math.abs(body.toBody - 0.6) < 1e-9);
  ok('a headshot outright kills an armored soldier', head.toBody >= heavy.maxhp);
  ok('a body shot does not', body.toBody < heavy.maxhp);

  // Shields absorb from the front and are bypassed by flanking.
  const sh = spawnEnemy('shieldSoldier', 'g0', pt, 'L0');
  const front = resolveDamage(sh, 4, { zone: 'body' });
  ok('a front shield absorbs damage instead of the body', front.toShield === 4 && front.toBody === 0);
  ok('the shield loses the absorbed amount', sh.shield === 2);
  const flank = resolveDamage(sh, 4, { zone: 'flank' });
  ok('flanking bypasses the shield entirely', flank.toBody > 0 && flank.toShield === 0);
  const sh2 = spawnEnemy('shieldSoldier', 'g0', pt, 'L0');
  ok('breaking the shield is reported', resolveDamage(sh2, 99, { zone: 'body' }).broke === true);

  // Body shots on the drugged tier must not be a viable strategy.
  const tr = spawnEnemy('trance', 'g0', pt, 'L0');
  ok('body shots barely hurt the drugged tier',
    resolveDamage(tr, 1, { zone: 'body' }).toBody < 0.2);
  ok('headshots still drop the drugged tier',
    resolveDamage(tr, 1, { zone: 'head' }).toBody >= tr.maxhp);
  ok('the drugged tier cannot be flinched', rollFlinch(tr) === false);

  // An enemy you cannot see must not be able to shoot you.
  let shots = 0;
  const hidden = spawnEnemy('soldierBlue', 'g0', pt, 'L0');
  hidden.state = 'ready'; hidden.cool = 0;
  for (let i = 0; i < 400; i++) {
    updateEnemy(hidden, 1 / 30, { canSee: false, playerExposed: true, fire: () => shots++ });
  }
  ok('an enemy out of your view never fires', shots === 0);

  // And one you can see must actually get a shot away.
  let seen = 0;
  const active = spawnEnemy('soldierBlue', 'g0', pt, 'L0');
  active.state = 'ready'; active.cool = 0;
  for (let i = 0; i < 600; i++) {
    updateEnemy(active, 1 / 30, { canSee: true, playerExposed: true, fire: () => seen++ });
  }
  ok('an engaged enemy does fire', seen > 0);

  const f = spawnEnemy('soldierBlue', 'g0', pt, 'L0');
  f.state = 'aiming'; f.aimT = 1; f.burst = 2;
  applyFlinch(f);
  ok('flinching interrupts an aim in progress', f.state === 'flinch' && f.aimT === 0 && f.burst === 0);
  updateEnemy(f, 5, { canSee: true, playerExposed: true, fire: () => {} });
  ok('an enemy recovers from flinch', f.state === 'ready');

  const d = spawnEnemy('soldierBlue', 'g0', pt, 'L0');
  killEnemy(d);
  ok('a killed enemy is marked dead', d.dead && d.state === 'dead');
  let after = 0;
  updateEnemy(d, 1, { canSee: true, playerExposed: true, fire: () => after++ });
  ok('a dead enemy never fires again', after === 0);

  // Props must never shoot at anything.
  let propShots = 0;
  const prop = spawnEnemy('explodable', 'g0', pt, 'L0');
  prop.state = 'ready'; prop.cool = 0;
  for (let i = 0; i < 200; i++) {
    updateEnemy(prop, 1 / 30, { canSee: true, playerExposed: true, fire: () => propShots++ });
  }
  ok('passive props never fire', propShots === 0);
}
