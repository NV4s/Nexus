// @ts-check
/**
 * Area runtime: the thing that ties cover, script, enemies and the clock
 * together into one playable unit.
 *
 * Structure follows the arcade's own: BeginArea, waves gated by the script,
 * a countdown with spoken callouts, and EndArea into a result screen. Running
 * the clock out costs a life rather than ending the run ("Watch it! Your time
 * runs out, you lose a life!"), and hands back a short grace window so a
 * timeout is a setback and not a wall.
 */

import { TC, TUNING, diff } from '../core/tune.js';
import { rng } from '../core/rng.js';
import { createCover, updateCover, visibleGroups, isSafeFrom } from './cover.js';
import { createScript, runScript, makeContext } from './script.js';
import { updateEnemy, resolveDamage, rollFlinch, applyFlinch, killEnemy, resetIds } from './enemy.js';
import { createScore, updateScore, finishArea } from './score.js';

/**
 * @param {object} def   area definition from content/stage*.js
 * @param {object} route cover-node graph from content/routes.js
 * @param {object} hooks side effects the runtime cannot do itself
 */
export function createArea(def, route, hooks = {}) {
  resetIds();
  const area = {
    def,
    route,
    cover: createCover(route),
    script: createScript(def.script),
    enemies: [],
    /** enemy fire in flight */
    shots: [],
    pickups: [],
    score: createScore(),
    timeLeft: def.par,
    parTime: def.par,
    elapsed: 0,
    /** CAUTION! window armed by a script beat */
    caution: null,
    flanked: new Set(),
    event: null,
    boss: null,
    state: 'running',   // running | cleared | failed
    lastRedShot: -99,
    callouts: [...TUNING.CALLOUTS],
    invuln: TC.INVINCIBLE_ON_ENTRY,
    result: null,
  };

  area.hooks = {
    say: () => {}, warp: () => {}, onHurt: () => {}, onFire: () => {},
    onKill: () => {}, onCaution: () => {}, onCallout: () => {},
    startEvent: () => {}, startBoss: () => {},
    ...hooks,
  };

  area.ctx = makeContext(area, {
    say: (k) => area.hooks.say(k),
    caution: (side, window, bonus) => armCaution(area, side, window, bonus),
    warp: (g) => area.hooks.warp(g),
    startEvent: (beat) => { area.event = { ...beat, t: 0 }; area.hooks.startEvent(beat); },
    startBoss: (id) => area.hooks.startBoss(id),
    areaClear: () => clearArea(area),
  });

  return area;
}

/**
 * CAUTION! on one side of the screen. Groups only reachable from that side are
 * marked flanked for the window's duration — killing them from there scores the
 * Side Attack bonus and reads through a riot shield.
 */
function armCaution(area, side, window, bonus) {
  area.caution = { side, t: 0, window, bonus };
  area.flanked.clear();
  for (let n = 0; n < area.route.nodes.length; n++) {
    const slot = area.route.nodes[n][side];
    if (slot && slot.sees) for (const g of slot.sees) area.flanked.add(g);
  }
  area.hooks.onCaution(side, window);
}

function clearArea(area) {
  if (area.state !== 'running') return;
  area.state = 'cleared';
  area.result = finishArea(area.score, area.timeLeft, area.parTime);
}

/** The player took a hit. Returns true if a life was actually lost. */
export function hurtPlayer(area) {
  if (area.invuln > 0) return false;
  area.invuln = TC.INVINCIBLE_AFTER_HIT;
  area.score.link = 0;
  area.hooks.onHurt();
  return true;
}

/** An enemy fires. `red` marks it a crisis shot. */
function enemyFire(area, e, red) {
  // MinRedBulletInterval — crisis shots can never be chained tighter than this.
  if (red && area.elapsed - area.lastRedShot < TC.RED_MIN_INTERVAL) red = false;
  if (red) area.lastRedShot = area.elapsed;

  area.shots.push({
    slot: e.slot,
    red,
    life: 0,
    // A red bullet gives exactly RedBulletDamageWaitTime to reach cover.
    ttl: red
      ? TC.RED_DAMAGE_WAIT
      : lerp(TUNING.BULLET_TRAVEL_FAR, TUNING.BULLET_TRAVEL_NEAR, 1 - e.z / 40),
    from: e.id,
    done: false,
  });
  area.hooks.onFire(e, red);
}

const lerp = (a, b, t) => a + (b - a) * t;

/** Apply a player shot to a target. Returns the score awarded, or 0. */
export function applyHit(area, target, hit, dmg, weaponId, flank) {
  const res = resolveDamage(target, dmg, hit);

  if (res.toShield > 0) {
    if (res.broke) area.hooks.onKill(target, 'shield');
    return 0;
  }

  if (rollFlinch(target)) applyFlinch(target);

  if (target.hp - res.toBody <= 0) {
    target.hp = 0;
    killEnemy(target);
    area.hooks.onKill(target, 'dead');
    if (target.carries) {
      area.pickups.push({ weapon: target.carries, wx: target.wx, z: target.z, t: 0, life: TUNING.PICKUP_LIFE });
    }
    return { killed: true, flags: { head: hit.zone === 'head', bullseye: !!hit.bullseye, sideAttack: flank } };
  }

  target.hp -= res.toBody;
  return { killed: false, flags: {} };
}

export function updateArea(area, input, dt) {
  if (area.state !== 'running') return area.state;

  area.elapsed += dt;
  area.invuln = Math.max(0, area.invuln - dt);
  updateScore(area.score, dt);

  // --- cover -------------------------------------------------------
  updateCover(area.cover, input, dt, () => area.hooks.reload && area.hooks.reload());
  const visible = visibleGroups(area.cover);
  const exposed = area.cover.exposure > 0.35;

  // --- CAUTION window ---------------------------------------------
  if (area.caution) {
    area.caution.t += dt;
    if (area.caution.t >= area.caution.window) {
      area.caution = null;
      area.flanked.clear();
    }
  }

  // --- clock -------------------------------------------------------
  area.timeLeft -= dt;
  while (area.callouts.length && area.timeLeft <= area.callouts[0]) {
    area.hooks.onCallout(area.callouts.shift());
  }
  if (area.timeLeft <= 0) {
    area.timeLeft = TUNING.TIMEOUT_REGRANT;
    // Running out costs a life, but the area continues.
    if (hurtPlayer(area) && area.hooks.outOfLives && area.hooks.outOfLives()) {
      area.state = 'failed';
      return area.state;
    }
  }

  // --- enemies -----------------------------------------------------
  for (const e of area.enemies) {
    updateEnemy(e, dt, {
      canSee: visible.has(e.group),
      playerExposed: exposed,
      fire: (self, red) => enemyFire(area, self, red),
    });
  }
  area.enemies = area.enemies.filter((e) => !(e.dead && e.deadT > 1.2));

  // --- incoming fire ----------------------------------------------
  for (const s of area.shots) {
    s.life += dt;
    if (s.life >= s.ttl && !s.done) {
      s.done = true;
      if (!isSafeFrom(area.cover, s.slot)) {
        if (hurtPlayer(area) && area.hooks.outOfLives && area.hooks.outOfLives()) {
          area.state = 'failed';
          return area.state;
        }
      }
    }
  }
  area.shots = area.shots.filter((s) => s.life < s.ttl + 0.25);

  for (const p of area.pickups) p.t += dt;
  area.pickups = area.pickups.filter((p) => !p.taken && p.t < p.life);

  // --- event / script ---------------------------------------------
  if (area.event) {
    area.event.t += dt;
    if (area.event.window && area.event.t >= area.event.window) area.event = null;
  }
  runScript(area.script, area.ctx, dt);

  return area.state;
}

export function selfTest(ok) {
  const route = {
    nodes: [
      { L: { cam: [-3, 1.4, 0], lean: [-1, 0.2, 0.3], sees: ['g0'] },
        R: { cam: [3, 1.4, 0], lean: [1, 0.2, 0.3], sees: ['g1'] } },
    ],
    edges: ['L0R0', 'R0L0'], entry: 'L0',
    groups: { g0: [{ x: -0.5, z: 20 }], g1: [{ x: 0.5, z: 20 }] },
  };
  const def = {
    id: 'test', stage: 1, name: 'TEST', par: 45,
    script: [
      { spawn: [['soldierBlue', 'g0', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  };
  const hold = (l, r) => ({ pedalL: l, pedalR: r });

  rng.reseedAll(5);
  const area = createArea(def, route);
  ok('area starts running with the par clock', area.state === 'running' && area.timeLeft === 45);
  ok('entry grants InvincibleDurationWhenEntry', area.invuln === TC.INVINCIBLE_ON_ENTRY);

  updateArea(area, hold(false, false), 0.016);
  ok('the opening beat spawns its wave', area.enemies.length === 1);
  ok('the script blocks on the live wave', area.script.blocked === 'clear');

  // Killing the wave must clear the area and produce a result.
  killEnemy(area.enemies[0]);
  updateArea(area, hold(false, false), 0.016);
  ok('clearing the wave clears the area', area.state === 'cleared');
  ok('a cleared area produces a result', !!area.result && area.result.clearTime >= 0);
  ok('a cleared area stops updating', updateArea(area, hold(false, false), 1) === 'cleared');

  // The clock must cost a life, not end the run outright.
  rng.reseedAll(5);
  let hurts = 0;
  const timed = createArea(def, route, { onHurt: () => hurts++ });
  timed.invuln = 0;
  updateArea(timed, hold(false, false), 46);
  ok('running the clock out costs a life', hurts === 1);
  ok('but the area continues with a grace window',
    timed.state === 'running' && timed.timeLeft === TUNING.TIMEOUT_REGRANT);

  // Callouts fire once each, at the recovered thresholds.
  rng.reseedAll(5);
  const called = [];
  const co = createArea(def, route, { onCallout: (n) => called.push(n) });
  updateArea(co, hold(false, false), 16);
  ok('the 30 second callout fires', called.join() === '30');
  updateArea(co, hold(false, false), 20);   // 9s left: only the 10 is due
  ok('the 10 second callout fires next, and only it', called.join() === '30,10');
  updateArea(co, hold(false, false), 5);    // 4s left
  ok('the 5 second callout follows', called.join() === '30,10,5');
  updateArea(co, hold(false, false), 0.1);
  ok('callouts never repeat', called.join() === '30,10,5');

  // Being hit while exposed costs a life; being in cover does not.
  rng.reseedAll(5);
  let hit = 0;
  const inc = createArea(def, route, { onHurt: () => hit++ });
  inc.invuln = 0;
  inc.cover.exposure = 1;
  inc.shots.push({ slot: 'L0', red: false, life: 0, ttl: 0.1, done: false });
  updateArea(inc, hold(true, false), 0.2);
  ok('a shot at your slot while exposed connects', hit === 1);

  rng.reseedAll(5);
  let safe = 0;
  const cov = createArea(def, route, { onHurt: () => safe++ });
  cov.invuln = 0;
  cov.cover.exposure = 0;
  cov.shots.push({ slot: 'L0', red: false, life: 0, ttl: 0.1, done: false });
  updateArea(cov, hold(false, false), 0.2);
  ok('the same shot in cover does not', safe === 0);

  // Invulnerability must actually protect.
  rng.reseedAll(5);
  let iv = 0;
  const invul = createArea(def, route, { onHurt: () => iv++ });
  invul.cover.exposure = 1;
  invul.shots.push({ slot: 'L0', red: false, life: 0, ttl: 0.1, done: false });
  updateArea(invul, hold(true, false), 0.2);
  ok('entry invulnerability absorbs the hit', iv === 0);

  // CAUTION marks the groups reachable from that side as flankable.
  rng.reseedAll(5);
  const ca = createArea(def, route);
  armCaution(ca, 'R', 2.5, 'side');
  ok('CAUTION flags the groups that side can see', ca.flanked.has('g1') && !ca.flanked.has('g0'));
  updateArea(ca, hold(false, false), 3);
  ok('the CAUTION window expires', ca.caution === null && ca.flanked.size === 0);

  // A carrier must drop its weapon where it died.
  rng.reseedAll(5);
  const drop = createArea(def, route);
  updateArea(drop, hold(false, false), 0.016);
  const carrier = drop.enemies[0];
  carrier.carries = 'shotgun';
  carrier.hp = 1;
  const res = applyHit(drop, carrier, { zone: 'head' }, 1, 0, false);
  ok('a lethal hit reports the kill', res.killed === true);
  ok('a headshot kill is flagged as one', res.flags.head === true);
  ok('a marked carrier drops its weapon', drop.pickups.length === 1 && drop.pickups[0].weapon === 'shotgun');

  // Crisis shots must respect MinRedBulletInterval.
  rng.reseedAll(5);
  const red = createArea(def, route);
  updateArea(red, hold(false, false), 0.016);
  const shooter = red.enemies[0];
  red.elapsed = 100;
  enemyFire(red, shooter, true);
  enemyFire(red, shooter, true);
  ok('two crisis shots cannot land inside the minimum interval',
    red.shots.filter((s) => s.red).length === 1);
}
