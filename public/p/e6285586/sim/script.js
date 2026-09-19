// @ts-check
/**
 * The beat interpreter.
 *
 * The arcade drove every area from Kismet graphs (SeqAct_BeginArea,
 * SeqAct_RefilEnemies, SeqAct_HSM, SeqAct_HUDSideAttackCaution, ...). Those
 * graphs are compiled away, but their vocabulary survives in the symbol table,
 * so areas here are a linear list of beats using the same verbs.
 *
 * The whole point is that no area, and no boss, contains code. If a boss needs
 * something new, it becomes an op here that every other beat can also use —
 * never a branch inside the boss runner.
 *
 * Ops:
 *   spawn   [[archetype, group, count], ...]   'archetype@weapon' marks a carrier
 *   hold    'clear' | 'timer' | seconds        block the pointer
 *   open    ['L0L1', ...]  / close             gate cover-graph edges
 *   say     dialogue key                       radio line + subtitle
 *   caution 'L' | 'R'                          CAUTION! + arm the Side Attack window
 *   time    +seconds                           add to the area clock
 *   event   'snipe'|'evade'|'move'|'crisis'    hand off to sim/events.js
 *   warp    group                              reposition the boss (Keith)
 *   boss    id                                 hand off to sim/boss.js
 *   done    true                               area clear
 */

import { rng } from '../core/rng.js';
import { spawnEnemy } from './enemy.js';

export function createScript(beats) {
  return {
    beats,
    pc: 0,
    /** what the pointer is currently waiting on, or null */
    blocked: null,
    waitT: 0,
    finished: false,
  };
}

/** Parse 'soldierRed@shotgun' into { kind, carries }. */
export function parseSpawnToken(token) {
  const at = token.indexOf('@');
  if (at < 0) return { kind: token, carries: null };
  return { kind: token.slice(0, at), carries: token.slice(at + 1) };
}

/**
 * Run the script forward until it blocks or ends.
 * `ctx` supplies the world the ops act on.
 */
export function runScript(script, ctx, dt = 0) {
  // Resolve whatever is currently blocking before advancing.
  if (script.blocked) {
    if (script.blocked === 'clear') {
      if (ctx.liveEnemies() > 0) return;
    } else if (script.blocked === 'timer') {
      if (ctx.timeLeft() > 0) return;
    } else if (script.blocked === 'event') {
      if (ctx.eventActive()) return;
    } else if (script.blocked === 'boss') {
      if (ctx.bossActive()) return;
    } else if (script.blocked === 'wait') {
      script.waitT -= dt;
      if (script.waitT > 0) return;
    }
    script.blocked = null;
  }

  let guard = 0;
  while (script.pc < script.beats.length) {
    // A script that never blocks would spin forever; catch the authoring bug
    // rather than hanging the tab.
    if (++guard > 500) throw new Error('script ran away without blocking');

    const beat = script.beats[script.pc];
    script.pc++;

    if (beat.open) for (const e of beat.open) ctx.openEdge(e);
    if (beat.close) for (const e of beat.close) ctx.closeEdge(e);
    if (beat.say) ctx.say(beat.say);
    if (typeof beat.time === 'number') ctx.addTime(beat.time);
    if (beat.caution) ctx.caution(beat.caution, beat.window || 2.5, beat.bonus || 'side');
    if (beat.warp) ctx.warp(beat.warp);
    if (beat.spawn) {
      for (const entry of beat.spawn) {
        const [token, group, count = 1] = entry;
        const { kind, carries } = parseSpawnToken(token);
        ctx.spawn(kind, group, count, carries, !!beat.red);
      }
    }
    if (beat.event) {
      ctx.startEvent(beat);
      script.blocked = 'event';
      return;
    }
    if (beat.boss) {
      ctx.startBoss(beat.boss);
      script.blocked = 'boss';
      return;
    }
    if (beat.done) {
      script.finished = true;
      ctx.areaClear();
      return;
    }
    if (beat.hold !== undefined) {
      if (typeof beat.hold === 'number') {
        script.blocked = 'wait';
        script.waitT = beat.hold;
      } else {
        script.blocked = beat.hold;
      }
      // Re-check immediately: holding for a clear that is already satisfied
      // must not cost a frame.
      if (script.blocked === 'clear' && ctx.liveEnemies() === 0) { script.blocked = null; continue; }
      return;
    }
  }
}

/**
 * Build the ctx object an area runtime hands the interpreter.
 * Kept here so bosses and areas provide the same surface.
 */
export function makeContext(area, hooks) {
  return {
    liveEnemies: () => area.enemies.filter((e) => !e.dead).length,
    timeLeft: () => area.timeLeft,
    eventActive: () => !!area.event,
    bossActive: () => !!area.boss && !area.boss.defeated,
    openEdge: (e) => area.cover.open.add(e),
    closeEdge: (e) => area.cover.open.delete(e),
    addTime: (n) => { area.timeLeft = Math.max(0, area.timeLeft + n); },
    say: (key) => hooks.say(key),
    caution: (side, window, bonus) => hooks.caution(side, window, bonus),
    warp: (group) => hooks.warp(group),
    spawn: (kind, group, count, carries, red) => {
      const points = area.route.groups[group];
      if (!points) throw new Error(`spawn into unknown group '${group}'`);
      for (let i = 0; i < count; i++) {
        const point = points[i % points.length];
        const slot = groupSlot(area.route, group);
        const e = spawnEnemy(kind, group, jitter(point, i), slot, { carries });
        if (red) e.def = { ...e.def, red: true };
        area.enemies.push(e);
      }
    },
    startEvent: (beat) => hooks.startEvent(beat),
    startBoss: (id) => hooks.startBoss(id),
    areaClear: () => hooks.areaClear(),
  };
}

/** Spread multiple enemies across one firing point so they never stack. */
function jitter(point, i) {
  if (i === 0) return point;
  return {
    x: point.x + rng.game.range(-0.55, 0.55),
    z: point.z + rng.game.range(-2.5, 2.5),
    h: point.h || 0,
  };
}

/** Which cover slot is set up to face this group? First one that sees it. */
export function groupSlot(route, group) {
  for (let n = 0; n < route.nodes.length; n++) {
    for (const side of ['L', 'R']) {
      const slot = route.nodes[n][side];
      if (slot && slot.sees && slot.sees.includes(group)) return side + n;
    }
  }
  return route.entry;
}

export function selfTest(ok) {
  ok('a plain spawn token has no carrier', parseSpawnToken('soldierRed').carries === null);
  ok('an @ token marks an ammo carrier',
    parseSpawnToken('soldierRed@shotgun').kind === 'soldierRed' &&
    parseSpawnToken('soldierRed@shotgun').carries === 'shotgun');

  const mkCtx = (over = {}) => {
    const log = [];
    return {
      log,
      live: 0,
      time: 40,
      liveEnemies() { return this.live; },
      timeLeft() { return this.time; },
      eventActive: () => false,
      bossActive: () => false,
      openEdge: (e) => log.push('open:' + e),
      closeEdge: (e) => log.push('close:' + e),
      addTime: (n) => log.push('time:' + n),
      say: (k) => log.push('say:' + k),
      caution: (s) => log.push('caution:' + s),
      warp: (g) => log.push('warp:' + g),
      spawn: (k, g, c) => { log.push(`spawn:${k}x${c}@${g}`); },
      startEvent: (b) => log.push('event:' + b.event),
      startBoss: (id) => log.push('boss:' + id),
      areaClear: () => log.push('clear'),
      ...over,
    };
  };

  // A hold for a clear must actually block while enemies live.
  const s1 = createScript([
    { spawn: [['soldierBlue', 'g0', 2]] },
    { hold: 'clear' },
    { done: true },
  ]);
  const c1 = mkCtx();
  c1.live = 2;
  runScript(s1, c1);
  ok('the pointer blocks on a live wave', s1.blocked === 'clear' && !s1.finished);
  ok('spawning happened before the block', c1.log[0] === 'spawn:soldierBluex2@g0');
  runScript(s1, c1);
  ok('the block holds while enemies remain', !s1.finished);
  c1.live = 0;
  runScript(s1, c1);
  ok('clearing the wave releases the pointer', s1.finished && c1.log.includes('clear'));

  // A hold whose condition is already met must not waste a frame.
  const s2 = createScript([{ hold: 'clear' }, { done: true }]);
  const c2 = mkCtx();
  runScript(s2, c2);
  ok('an already-satisfied hold falls straight through', s2.finished);

  // Ops on a single beat all fire, in order.
  const s3 = createScript([
    { open: ['L0L1'], close: ['R0R1'], say: 'cat.move', time: 12, caution: 'R' },
    { hold: 'clear' }, { done: true },
  ]);
  const c3 = mkCtx();
  runScript(s3, c3);
  ok('open, close, say, time and caution all fire from one beat',
    c3.log.includes('open:L0L1') && c3.log.includes('close:R0R1') &&
    c3.log.includes('say:cat.move') && c3.log.includes('time:12') &&
    c3.log.includes('caution:R'));

  // Events and bosses must block until they report themselves finished.
  let eventRunning = true;
  const s4 = createScript([{ event: 'evade', pedal: 'L' }, { done: true }]);
  const c4 = mkCtx({ eventActive: () => eventRunning });
  runScript(s4, c4);
  ok('an event blocks the pointer', s4.blocked === 'event' && !s4.finished);
  runScript(s4, c4);
  ok('the pointer stays blocked while the event runs', !s4.finished);
  eventRunning = false;
  runScript(s4, c4);
  ok('finishing the event releases the pointer', s4.finished);

  let bossAlive = true;
  const s5 = createScript([{ boss: 'hacs' }, { done: true }]);
  const c5 = mkCtx({ bossActive: () => bossAlive });
  runScript(s5, c5);
  ok('a boss blocks the pointer', s5.blocked === 'boss');
  bossAlive = false;
  runScript(s5, c5);
  ok('beating the boss clears the area', s5.finished);

  // A numeric hold is a timed pause.
  const s6 = createScript([{ hold: 1.0 }, { done: true }]);
  const c6 = mkCtx();
  runScript(s6, c6, 0);
  ok('a numeric hold waits', s6.blocked === 'wait' && !s6.finished);
  runScript(s6, c6, 0.5);
  ok('a numeric hold is still waiting midway', !s6.finished);
  runScript(s6, c6, 0.6);
  ok('a numeric hold expires', s6.finished);

  // A script with no blocking op is an authoring bug and must be caught.
  ok('a runaway script throws instead of hanging', (() => {
    const bad = createScript(Array.from({ length: 600 }, () => ({ say: 'x' })));
    try { runScript(bad, mkCtx()); return false; } catch { return true; }
  })());

  // Spawning into a group the route lacks must fail loudly.
  const route = {
    nodes: [{ L: { cam: [0, 0, 0], lean: [0, 0, 0], sees: ['g0'] },
              R: { cam: [0, 0, 0], lean: [0, 0, 0], sees: ['g1'] } }],
    edges: ['L0R0'], entry: 'L0', groups: { g0: [{ x: 0, z: 20 }], g1: [{ x: 1, z: 20 }] },
  };
  const area = { enemies: [], route, timeLeft: 40, cover: { open: new Set() }, event: null, boss: null };
  const ctx = makeContext(area, {
    say() {}, caution() {}, warp() {}, startEvent() {}, startBoss() {}, areaClear() {},
  });
  ok('spawning into an unknown group throws',
    (() => { try { ctx.spawn('soldierBlue', 'nope', 1); return false; } catch { return true; } })());

  rng.reseedAll(3);
  ctx.spawn('soldierBlue', 'g0', 3, null, false);
  ok('a count spawns that many enemies', area.enemies.length === 3);
  ok('stacked spawns are spread apart',
    new Set(area.enemies.map((e) => e.wx)).size > 1);
  ok('spawned enemies are assigned the slot that faces their group',
    area.enemies.every((e) => e.slot === 'L0'));
  ok('groupSlot finds the right-hand slot for its group', groupSlot(route, 'g1') === 'R0');

  ctx.spawn('soldierBlue', 'g0', 1, 'shotgun', false);
  ok('a carrier is tagged with what it drops',
    area.enemies[area.enemies.length - 1].carries === 'shotgun');
}
