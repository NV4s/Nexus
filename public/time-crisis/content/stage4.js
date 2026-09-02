// @ts-check
/**
 * Stage 4 — jungle. Eight areas, from the stage's Area1..Area8 map directories.
 *
 * The setting is confirmed by the recording and by the stage's own ambience cue
 * in the sound bank. This is the stage the localisation's sniper strings belong
 * to, so the sniper event lands here, and the boss is fought across four phases
 * matching the four boss map sets the directory carries.
 *
 * The drugged tier arrives here — body shots barely register on them, so this
 * stage is where headshots stop being a bonus and start being the method.
 */

export const STAGE4 = [
  {
    id: '4-0', stage: 4, area: 1, name: 'JUNGLE TRAIL', par: 50, route: 'jungleTrail',
    script: [
      { say: 'cat.jungle' },
      { spawn: [['soldierBlack', 'p0', 2], ['crisisShooter', 'p1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisElite', 'p2', 2], ['shieldSoldierRed', 'p3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '4-1', stage: 4, area: 2, name: 'CANOPY', par: 52, route: 'clearing',
    script: [
      // First raised firing point in the stage — the canopy positions.
      { spawn: [['sentrySoldier', 'r1', 1], ['soldierBlack', 'r0', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['turretSoldier', 'r4', 1], ['crisisElite', 'r2', 2]] },
      { caution: 'R', window: 3.0, bonus: 'side' },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '4-2', stage: 4, area: 3, name: 'OVERLOOK', par: 55, route: 'clearing',
    script: [
      { say: 'cat.snipe' },
      // The sniper event the localisation names: aimed one-shot kills.
      { event: 'snipe', targets: 4, window: 12 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisElite', 'r2', 2], ['soldierBlack@sniperrifle', 'r3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '4-3', stage: 4, area: 4, name: 'RAVINE', par: 55, route: 'ravine',
    script: [
      { spawn: [['soldierBlack', 'w0', 2], ['heavyGun', 'w1', 1]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'L', window: 1.05 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisElite', 'w2', 2], ['shieldSoldierRed', 'w3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '4-4', stage: 4, area: 5, name: 'RIVER CROSSING', par: 55, route: 'ravine',
    script: [
      // The drugged tier arrives. Body shots barely register on these.
      { say: 'cat.drugged' },
      { spawn: [['neoSoldier', 'w0', 2], ['soldierBlack', 'w1', 2]] },
      { hold: 'clear' },
      { time: +14, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['trance', 'w2', 2], ['neoSoldierRed', 'w3', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['neoShield', 'w4', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '4-5', stage: 4, area: 6, name: 'DEEP JUNGLE', par: 58, route: 'jungleTrail',
    script: [
      { spawn: [['trance', 'p0', 2], ['crisisElite', 'p1', 2]] },
      { hold: 'clear' },
      { event: 'crisis', markers: 10, window: 12 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['tranceRunner', 'p2', 2], ['neoShield', 'p3', 1]] },
      { caution: 'L', window: 2.8, bonus: 'side' },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['neoSoldierRed', 'p4', 2], ['soldierBlack@grenade', 'p5', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '4-6', stage: 4, area: 7, name: 'FUEL DEPOT', par: 58, route: 'ravine',
    script: [
      { spawn: [['explodable', 'w0', 2], ['neoSoldier', 'w1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { say: 'cat.fuelTanks' },
      { spawn: [['heavyGun', 'w2', 1], ['trance', 'w3', 2], ['explodable', 'w2', 1]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'R', window: 1.0 },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['tranceRunner', 'w4', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '4-7', stage: 4, area: 8, name: 'STRONGHOLD', par: 75, route: 'bossArena',
    script: [
      { say: 'cat.keith' },
      { spawn: [['neoShield', 'g0', 1], ['trance', 'g1', 2]] },
      { hold: 'clear' },
      { time: +20 },
      // Four phases, matching the four boss map sets in the stage directory.
      { boss: 'keith' },
      { done: true },
    ],
  },
];

export default STAGE4;

export function selfTest(ok) {
  ok('stage 4 has the eight recovered areas', STAGE4.length === 8);
  ok('area numbers run 1 to 8', STAGE4.every((a, i) => a.area === i + 1));
  ok('every id follows stage-index form', STAGE4.every((a, i) => a.id === `4-${i}`));
  ok('every area names a route and a par time',
    STAGE4.every((a) => !!a.route && a.par > 0));
  ok('every script terminates', STAGE4.every((a) => a.script.some((b) => b.done || b.boss)));
  ok('every script blocks somewhere',
    STAGE4.every((a) => a.script.some((b) => b.hold !== undefined || b.boss || b.event)));

  // The sniper event belongs to this stage.
  const events = STAGE4.flatMap((a) => a.script.filter((b) => b.event).map((b) => b.event));
  ok('the sniper event appears here', events.includes('snipe'));
  ok('the sniper area asks for several targets',
    STAGE4[2].script.find((b) => b.event === 'snipe').targets >= 3);
  ok('evade and crisis events also appear',
    events.includes('evade') && events.includes('crisis'));

  // The drugged tier is introduced, and only from the middle of the stage.
  const firstWith = (kind) => STAGE4.findIndex((a) =>
    a.script.some((b) => (b.spawn || []).some((s) => s[0].split('@')[0] === kind)));
  ok('the drugged tier arrives', firstWith('neoSoldier') >= 0);
  ok('it is held back past the opening areas', firstWith('neoSoldier') >= 4);
  ok('the headshot-only tier appears', firstWith('trance') >= 0);
  ok('runners come after the standing drugged tier',
    firstWith('tranceRunner') > firstWith('trance'));

  // Difficulty floor keeps climbing.
  const kinds = new Set();
  for (const a of STAGE4) {
    for (const b of a.script) for (const s of b.spawn || []) kinds.add(s[0].split('@')[0]);
  }
  ok('the early tiers are gone',
    !kinds.has('soldierBlue') && !kinds.has('soldierRed') && !kinds.has('soldierYellow'));
  ok('raised firing points are used', kinds.has('sentrySoldier') || kinds.has('turretSoldier'));
  ok('destructibles appear at the depot', kinds.has('explodable'));

  ok('only the last area runs a boss',
    STAGE4.filter((a) => a.script.some((b) => b.boss)).length === 1 &&
    STAGE4[7].script.some((b) => b.boss === 'keith'));
  ok('the boss area gets the longest clock',
    STAGE4[7].par === Math.max(...STAGE4.map((a) => a.par)));
  ok('a carrier drops the sniper rifle for its own area',
    STAGE4[2].script.some((b) => (b.spawn || []).some((s) => s[0].includes('@sniperrifle'))));
}
