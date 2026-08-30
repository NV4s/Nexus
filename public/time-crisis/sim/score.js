// @ts-check
/**
 * Scoring, bonuses and the per-area / per-stage / total tallies.
 *
 * The bonus vocabulary is recovered from the HUD labels and the score tables in
 * the executable: HIT!, LINKED HITS, MAX LINKED HITS, SIDE ATTACK x, BULL'S EYE,
 * HEADSHOTS, ONE SHOT KILL x, SHURIKEN BONUS x, CLEAN SHOTS, ENEMIES DOWN,
 * ACCURACY, CLEAR TIME, AREA SCORE, TOTAL SCORE, BEST WEAPON!
 *
 * The point values behind them are not recoverable and are authored in
 * core/tune.js.
 */

import { TUNING } from '../core/tune.js';

export function createScore() {
  return {
    total: 0,
    /** LINKED HITS — consecutive hits without a miss */
    link: 0,
    maxLink: 0,
    linkT: 0,
    shots: 0,
    hits: 0,
    kills: 0,
    headshots: 0,
    bullseyes: 0,
    sideAttacks: 0,
    sideAttackChain: 0,
    oneShotKills: 0,
    shurikens: 0,
    /** kills per weapon id, for BEST WEAPON! on the result screen */
    byWeapon: {},
    /** popups the HUD is currently showing */
    popups: [],
  };
}

export function createRunTotals() {
  return {
    score: 0, shots: 0, hits: 0, kills: 0, headshots: 0, bullseyes: 0,
    sideAttacks: 0, oneShotKills: 0, shurikens: 0, maxLink: 0,
    continues: 0, playTime: 0, byWeapon: {}, areas: [],
  };
}

const popup = (s, text, kind) => {
  s.popups.push({ text, kind, t: 0, life: 1.1 });
  if (s.popups.length > 6) s.popups.shift();
};

export function addPoints(s, points, label, kind = 'bonus') {
  s.total += Math.round(points);
  if (label) popup(s, label, kind);
  return s.total;
}

/** A shot left the barrel. Every pellet counts separately, as the arcade did. */
export function noteShot(s) { s.shots++; }

/** A shot missed everything: the link chain breaks. */
export function noteMiss(s) {
  s.link = 0;
  s.linkT = 0;
}

/** A shot connected. Returns the link multiplier applied to the kill. */
export function noteHit(s) {
  s.hits++;
  s.link++;
  s.linkT = TUNING.COMBO_WINDOW;
  if (s.link > s.maxLink) s.maxLink = s.link;
  return linkMultiplier(s);
}

export const linkMultiplier = (s) =>
  1 + Math.min(s.link, TUNING.COMBO_CAP) * TUNING.COMBO_STEP;

/**
 * Award a kill.
 * `flags` carries which bonuses this particular kill earned.
 */
export function noteKill(s, baseScore, weaponId, flags = {}) {
  s.kills++;
  s.byWeapon[weaponId] = (s.byWeapon[weaponId] || 0) + 1;

  let points = baseScore * linkMultiplier(s);

  if (flags.head) {
    s.headshots++;
    points *= TUNING.HEADSHOT_SCORE_MULT;
    popup(s, 'HEADSHOT', 'head');
  }
  if (flags.bullseye) {
    s.bullseyes++;
    points += TUNING.BULLSEYE_SCORE;
    popup(s, "BULL'S EYE", 'bullseye');
  }
  if (flags.sideAttack) {
    s.sideAttacks++;
    // SideAttackComboScoreTable — chaining flanks pays progressively more.
    const tier = Math.min(s.sideAttackChain, TUNING.SIDE_ATTACK_SCORE.length - 1);
    points += TUNING.SIDE_ATTACK_SCORE[tier];
    s.sideAttackChain++;
    popup(s, `SIDE ATTACK x${s.sideAttackChain}`, 'side');
  }
  if (flags.oneShotKill) {
    s.oneShotKills++;
    points += TUNING.ONE_SHOT_KILL_SCORE;
    popup(s, `ONE SHOT KILL x${s.oneShotKills}`, 'osk');
  }
  if (flags.shuriken) {
    s.shurikens++;
    points += TUNING.SHURIKEN_SCORE;
    popup(s, `SHURIKEN BONUS x${s.shurikens}`, 'shuriken');
  }

  s.total += Math.round(points);
  return Math.round(points);
}

/** The flank chain only survives while flanking keeps happening. */
export function breakSideChain(s) { s.sideAttackChain = 0; }

export function updateScore(s, dt) {
  if (s.linkT > 0) {
    s.linkT -= dt;
    if (s.linkT <= 0) s.link = 0;
  }
  for (const p of s.popups) p.t += dt;
  s.popups = s.popups.filter((p) => p.t < p.life);
}

export const accuracy = (s) => (s.shots ? s.hits / s.shots : 0);

/** BEST WEAPON! — whichever weapon took the most kills this area. */
export function bestWeapon(s) {
  let best = null, most = 0;
  for (const [id, n] of Object.entries(s.byWeapon)) {
    if (n > most) { most = n; best = +id; }
  }
  return best;
}

/**
 * Close out an area. Returns the result-screen rows and the bonus awarded.
 * CLEAR TIME pays the time bonus; ACCURACY pays out proportionally.
 */
export function finishArea(s, timeLeft, parTime) {
  const timeBonus = Math.round(Math.max(0, timeLeft) * TUNING.TIME_BONUS_PER_SEC);
  const acc = accuracy(s);
  const accBonus = Math.round(acc * TUNING.ACCURACY_BONUS);
  s.total += timeBonus + accBonus;
  return {
    areaScore: s.total,
    clearTime: Math.max(0, parTime - timeLeft),
    timeBonus,
    accuracy: acc,
    accuracyBonus: accBonus,
    kills: s.kills,
    headshots: s.headshots,
    bullseyes: s.bullseyes,
    sideAttacks: s.sideAttacks,
    maxLink: s.maxLink,
    cleanShots: s.hits,
    shots: s.shots,
    bestWeapon: bestWeapon(s),
  };
}

/** Fold an area result into the run totals. */
export function accumulate(totals, s, result) {
  totals.score += s.total;
  totals.shots += s.shots;
  totals.hits += s.hits;
  totals.kills += s.kills;
  totals.headshots += s.headshots;
  totals.bullseyes += s.bullseyes;
  totals.sideAttacks += s.sideAttacks;
  totals.oneShotKills += s.oneShotKills;
  totals.shurikens += s.shurikens;
  if (s.maxLink > totals.maxLink) totals.maxLink = s.maxLink;
  for (const [id, n] of Object.entries(s.byWeapon)) {
    totals.byWeapon[id] = (totals.byWeapon[id] || 0) + n;
  }
  totals.areas.push(result);
  return totals;
}

export function selfTest(ok) {
  const s = createScore();
  ok('a fresh tally is empty', s.total === 0 && s.link === 0);

  noteShot(s); noteHit(s);
  ok('a hit starts the link chain', s.link === 1 && s.hits === 1);
  noteShot(s); noteHit(s);
  ok('links accumulate', s.link === 2);
  ok('max link tracks the peak', s.maxLink === 2);
  noteShot(s); noteMiss(s);
  ok('a miss breaks the chain', s.link === 0);
  ok('but max link is remembered', s.maxLink === 2);
  ok('accuracy counts every shot fired', Math.abs(accuracy(s) - 2 / 3) < 1e-9);

  // The link chain must expire on its own, or it is not a chain.
  const t = createScore();
  noteShot(t); noteHit(t);
  updateScore(t, TUNING.COMBO_WINDOW + 0.1);
  ok('the link chain times out', t.link === 0);

  // Headshots must be worth strictly more than body shots.
  const a = createScore(), b = createScore();
  const plain = noteKill(a, 1000, 0, {});
  const head = noteKill(b, 1000, 0, { head: true });
  ok('a headshot kill scores more than a body kill', head > plain);

  const c = createScore();
  noteKill(c, 100, 0, { bullseye: true });
  ok('bullseye is counted and paid', c.bullseyes === 1 && c.total >= TUNING.BULLSEYE_SCORE);

  // Chained flanks must pay progressively more — that is the whole table.
  const d = createScore();
  const first = noteKill(d, 0, 0, { sideAttack: true });
  const second = noteKill(d, 0, 0, { sideAttack: true });
  ok('side attacks are counted', d.sideAttacks === 2);
  ok('chained side attacks pay more each time', second > first);
  breakSideChain(d);
  ok('breaking the chain resets the tier', d.sideAttackChain === 0);

  const e = createScore();
  noteKill(e, 100, 4, { oneShotKill: true });
  ok('one shot kill is counted and paid', e.oneShotKills === 1);

  // BEST WEAPON! must name the weapon that actually did the work.
  const f = createScore();
  noteKill(f, 10, 1, {}); noteKill(f, 10, 1, {}); noteKill(f, 10, 2, {});
  ok('best weapon is the one with the most kills', bestWeapon(f) === 1);
  ok('best weapon is null before any kill', bestWeapon(createScore()) === null);

  // Longer links must be worth more, or the mechanic does nothing.
  const g = createScore(), h = createScore();
  for (let i = 0; i < 10; i++) { noteShot(h); noteHit(h); }
  ok('a long link multiplies the kill', noteKill(h, 1000, 0, {}) > noteKill(g, 1000, 0, {}));

  const r = createScore();
  noteShot(r); noteHit(r); noteKill(r, 500, 0, {});
  const res = finishArea(r, 20, 45);
  ok('area result pays a time bonus', res.timeBonus === 20 * TUNING.TIME_BONUS_PER_SEC);
  ok('area result reports clear time', res.clearTime === 25);
  ok('area result reports full accuracy', Math.abs(res.accuracy - 1) < 1e-9);
  ok('time bonus is never negative', finishArea(createScore(), -5, 45).timeBonus === 0);

  const totals = createRunTotals();
  accumulate(totals, r, res);
  ok('totals accumulate an area', totals.areas.length === 1 && totals.kills === 1);
}
