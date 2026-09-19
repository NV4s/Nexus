// @ts-check
/**
 * Scripted event sequences.
 *
 * Four kinds, all observed in the recording and all named in the symbol table
 * (SeqAct_CrisisEventStart, SeqAct_SnipeEventStart, SeqAct_MoveDanger, and the
 * evade prompt):
 *
 *   evade   a pedal is named on screen; press it before the count runs out
 *   crisis  markers appear; shoot them all before the clock expires
 *   snipe   a scoped one-shot-kill sequence against a countdown
 *   move    reach a named cover slot before the count runs out
 *
 * Each resolves to 'success' or 'fail'. A failed evade or move costs a life;
 * a failed crisis or snipe only forfeits its bonus, which is why `fail` carries
 * a `penalty` rather than the caller assuming one.
 */

import { rng } from '../core/rng.js';
import { TUNING } from '../core/tune.js';

/** Bonus paid per marker cleared in a crisis event. Invented. */
const CRISIS_MARKER_SCORE = 1500;
const CRISIS_BULLSEYE_SCORE = 900;

/**
 * @param {object} beat the script beat that started this event
 */
export function createEvent(beat) {
  const kind = beat.event;
  const base = {
    kind,
    t: 0,
    state: 'running',
    window: beat.window ?? defaultWindow(kind),
    penalty: kind === 'evade' || kind === 'move' ? 'hit' : 'none',
    bonus: 0,
  };

  if (kind === 'evade') {
    return { ...base, pedal: beat.pedal || rng.script.pick(['L', 'R']), pressed: false };
  }
  if (kind === 'move') {
    return { ...base, slot: beat.slot, arrived: false };
  }
  if (kind === 'crisis') {
    const n = beat.markers ?? 10;
    return {
      ...base,
      markers: Array.from({ length: n }, (_, i) => ({
        id: i, alive: true,
        x: rng.script.range(-0.8, 0.8),
        z: rng.script.range(10, 30),
        bullseye: false,
      })),
      hit: 0, bullseyes: 0, total: n,
    };
  }
  if (kind === 'snipe') {
    return { ...base, targets: beat.targets ?? 1, downed: 0, shots: 0 };
  }
  return base;
}

function defaultWindow(kind) {
  if (kind === 'evade') return 1.1;
  if (kind === 'move') return 2.4;
  if (kind === 'crisis') return 12;
  if (kind === 'snipe') return 10;
  return 3;
}

/** The numeral the evade prompt counts down, or null when not counting. */
export function countdownNumeral(ev) {
  if (ev.kind !== 'evade' && ev.kind !== 'move') return null;
  const left = Math.max(0, ev.window - ev.t);
  return left > 0 ? Math.ceil(left) : 0;
}

/**
 * One frame of an event.
 * `input` supplies pedal state; `cover` the player's slot, for move events.
 */
export function updateEvent(ev, dt, input, cover) {
  if (ev.state !== 'running') return ev.state;
  ev.t += dt;

  if (ev.kind === 'evade') {
    const held = input.pedalL ? 'L' : input.pedalR ? 'R' : null;
    // Only the named pedal counts. Pressing the wrong one is not a failure in
    // itself, it just does not satisfy the prompt.
    if (held === ev.pedal) { ev.pressed = true; ev.state = 'success'; return ev.state; }
  }

  if (ev.kind === 'move') {
    if (cover && cover.slot === ev.slot && !cover.moving) {
      ev.arrived = true; ev.state = 'success'; return ev.state;
    }
  }

  if (ev.kind === 'crisis') {
    if (ev.markers.every((m) => !m.alive)) {
      ev.bonus = ev.hit * CRISIS_MARKER_SCORE + ev.bullseyes * CRISIS_BULLSEYE_SCORE;
      ev.state = 'success';
      return ev.state;
    }
  }

  if (ev.kind === 'snipe') {
    if (ev.downed >= ev.targets) {
      ev.bonus = TUNING.ONE_SHOT_KILL_SCORE * ev.downed;
      ev.state = 'success';
      return ev.state;
    }
  }

  if (ev.t >= ev.window) {
    // A crisis or snipe that runs out still banks whatever was cleared.
    if (ev.kind === 'crisis') ev.bonus = ev.hit * CRISIS_MARKER_SCORE + ev.bullseyes * CRISIS_BULLSEYE_SCORE;
    if (ev.kind === 'snipe') ev.bonus = TUNING.ONE_SHOT_KILL_SCORE * ev.downed;
    ev.state = 'fail';
  }
  return ev.state;
}

/** A shot landed on a crisis marker. */
export function hitMarker(ev, id, bullseye) {
  if (ev.kind !== 'crisis' || ev.state !== 'running') return false;
  const m = ev.markers.find((k) => k.id === id && k.alive);
  if (!m) return false;
  m.alive = false;
  m.bullseye = !!bullseye;
  ev.hit++;
  if (bullseye) ev.bullseyes++;
  return true;
}

/** A snipe shot was taken. Returns true if it downed a target. */
export function snipeShot(ev, onTarget) {
  if (ev.kind !== 'snipe' || ev.state !== 'running') return false;
  ev.shots++;
  if (onTarget) { ev.downed++; return true; }
  return false;
}

/** Elapsed time to show on the crisis result screen. */
export const eventClearTime = (ev) => Math.min(ev.t, ev.window);

export function selfTest(ok) {
  rng.reseedAll(31);
  const none = { pedalL: false, pedalR: false };

  // --- evade -------------------------------------------------------
  const ev = createEvent({ event: 'evade', pedal: 'L', window: 1.1 });
  ok('an evade names a pedal', ev.pedal === 'L');
  ok('a failed evade costs a life', ev.penalty === 'hit');
  ok('the evade counts down from its window', countdownNumeral(ev) === 2);
  updateEvent(ev, 0.3, { pedalL: false, pedalR: true }, null);
  ok('the wrong pedal does not satisfy the prompt', ev.state === 'running');
  updateEvent(ev, 0.1, { pedalL: true, pedalR: false }, null);
  ok('the named pedal completes the evade', ev.state === 'success');

  const late = createEvent({ event: 'evade', pedal: 'R', window: 1.0 });
  updateEvent(late, 1.2, none, null);
  ok('an evade times out as a failure', late.state === 'fail');
  ok('a resolved event stops updating',
    updateEvent(late, 5, { pedalR: true }, null) === 'fail');
  ok('the countdown floors at zero', countdownNumeral(late) === 0);

  // --- move --------------------------------------------------------
  const mv = createEvent({ event: 'move', slot: 'R1', window: 2.4 });
  updateEvent(mv, 0.2, none, { slot: 'L0', moving: null });
  ok('a move event waits for the named slot', mv.state === 'running');
  updateEvent(mv, 0.2, none, { slot: 'R1', moving: { to: 'R1' } });
  ok('arriving mid-traversal does not count yet', mv.state === 'running');
  updateEvent(mv, 0.2, none, { slot: 'R1', moving: null });
  ok('reaching the slot completes the move', mv.state === 'success');

  // --- crisis ------------------------------------------------------
  const cr = createEvent({ event: 'crisis', markers: 3, window: 12 });
  ok('a crisis spawns its markers', cr.markers.length === 3 && cr.total === 3);
  ok('a failed crisis costs no life', cr.penalty === 'none');
  ok('hitting a marker registers', hitMarker(cr, 0, false) === true);
  ok('the same marker cannot be hit twice', hitMarker(cr, 0, false) === false);
  ok('an unknown marker is rejected', hitMarker(cr, 99, false) === false);
  hitMarker(cr, 1, true);
  ok('bullseyes are counted separately', cr.bullseyes === 1 && cr.hit === 2);
  updateEvent(cr, 0.1, none, null);
  ok('a crisis stays running while markers remain', cr.state === 'running');
  hitMarker(cr, 2, false);
  updateEvent(cr, 0.1, none, null);
  ok('clearing every marker succeeds', cr.state === 'success');
  ok('the bonus pays per marker and per bullseye',
    cr.bonus === 3 * CRISIS_MARKER_SCORE + 1 * CRISIS_BULLSEYE_SCORE);

  // A timed-out crisis still banks what was cleared.
  const partial = createEvent({ event: 'crisis', markers: 4, window: 2 });
  hitMarker(partial, 0, false);
  updateEvent(partial, 2.5, none, null);
  ok('a timed-out crisis still banks cleared markers',
    partial.state === 'fail' && partial.bonus === CRISIS_MARKER_SCORE);

  // --- snipe -------------------------------------------------------
  const sn = createEvent({ event: 'snipe', targets: 2, window: 10 });
  ok('a snipe misses do not down a target', snipeShot(sn, false) === false);
  ok('shots are counted either way', sn.shots === 1);
  snipeShot(sn, true); snipeShot(sn, true);
  updateEvent(sn, 0.1, none, null);
  ok('downing every target succeeds', sn.state === 'success');
  ok('the snipe bonus pays per target',
    sn.bonus === TUNING.ONE_SHOT_KILL_SCORE * 2);

  // --- shared ------------------------------------------------------
  ok('every kind gets a default window',
    ['evade', 'crisis', 'snipe', 'move'].every((k) => createEvent({ event: k }).window > 0));
  ok('clear time never exceeds the window',
    eventClearTime({ t: 99, window: 12 }) === 12);

  // An evade with no pedal named picks one, so the prompt is never blank.
  rng.reseedAll(4);
  ok('an unspecified evade still names a pedal',
    ['L', 'R'].includes(createEvent({ event: 'evade' }).pedal));
}
