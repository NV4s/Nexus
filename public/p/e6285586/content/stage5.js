// @ts-check
/**
 * Stage 5 — industrial. Five areas, from the stage's Area1..Area5 map
 * directories, closing on Wild Fang across the two forms his boss maps carry.
 *
 * Short stage, so the pressure comes from density rather than length: the
 * drugged tier is the baseline here rather than a novelty, and every area runs
 * an event.
 */

export const STAGE5 = [
  {
    id: '5-0', stage: 5, area: 1, name: 'GANTRY', par: 55, route: 'gantry',
    script: [
      { say: 'cat.plant' },
      { spawn: [['trance', 'x0', 2], ['crisisElite', 'x1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['turretSoldier', 'x3', 1], ['neoSoldierRed', 'x2', 2]] },
      { caution: 'R', window: 3.0, bonus: 'side' },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '5-1', stage: 5, area: 2, name: 'CATWALK', par: 55, route: 'gantry',
    script: [
      { spawn: [['neoShield', 'x0', 1], ['tranceRunner', 'x1', 2]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'R', window: 1.0 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['heavyGun', 'x3', 1], ['trance', 'x2', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['crisisElite', 'x4', 2], ['neoSoldierRed', 'x5', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '5-2', stage: 5, area: 3, name: 'FOUNDRY', par: 58, route: 'foundry',
    script: [
      { spawn: [['explodable', 'y0', 2], ['trance', 'y1', 2]] },
      { hold: 'clear' },
      { event: 'crisis', markers: 10, window: 12 },
      { time: +14, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['neoShield', 'y2', 1], ['tranceRunner', 'y3', 2]] },
      { caution: 'L', window: 2.8, bonus: 'side' },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '5-3', stage: 5, area: 4, name: 'CRUCIBLE', par: 60, route: 'foundry',
    script: [
      { spawn: [['tranceRunner', 'y0', 3], ['crisisElite', 'y1', 2]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'L', window: 1.0 },
      { time: +14, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['heavyGun', 'y2', 1], ['neoShield', 'y3', 1], ['trance', 'y2', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '5-4', stage: 5, area: 5, name: 'REACTOR FLOOR', par: 75, route: 'bossArena',
    script: [
      { say: 'cat.wildFang' },
      { spawn: [['neoShield', 'g0', 1], ['tranceRunner', 'g1', 2]] },
      { hold: 'clear' },
      { time: +20 },
      // Two forms, matching the two boss map sets the stage directory carries.
      { boss: 'wildfang' },
      { done: true },
    ],
  },
];

export default STAGE5;

export function selfTest(ok) {
  ok('stage 5 has the five recovered areas', STAGE5.length === 5);
  ok('area numbers run 1 to 5', STAGE5.every((a, i) => a.area === i + 1));
  ok('every id follows stage-index form', STAGE5.every((a, i) => a.id === `5-${i}`));
  ok('every script terminates', STAGE5.every((a) => a.script.some((b) => b.done || b.boss)));
  ok('every script blocks somewhere',
    STAGE5.every((a) => a.script.some((b) => b.hold !== undefined || b.boss || b.event)));

  // A short stage leans on density, so every area should carry an event or a
  // flank window rather than only waves.
  ok('every non-boss area runs an event or a caution window',
    STAGE5.slice(0, 4).every((a) =>
      a.script.some((b) => b.event || b.caution)));

  // The drugged tier is the baseline here, not a novelty.
  const kinds = new Set();
  for (const a of STAGE5) {
    for (const b of a.script) for (const s of b.spawn || []) kinds.add(s[0].split('@')[0]);
  }
  ok('the drugged tier is the baseline',
    kinds.has('trance') && kinds.has('tranceRunner') && kinds.has('neoShield'));
  ok('no plain soldier tiers remain',
    !['soldierBlue', 'soldierRed', 'soldierYellow', 'soldierBlack'].some((k) => kinds.has(k)));

  ok('only the last area runs a boss',
    STAGE5.filter((a) => a.script.some((b) => b.boss)).length === 1 &&
    STAGE5[4].script.some((b) => b.boss === 'wildfang'));
  ok('the boss area gets the longest clock',
    STAGE5[4].par === Math.max(...STAGE5.map((a) => a.par)));
  ok('par times climb through the stage', STAGE5[3].par > STAGE5[0].par);
}
