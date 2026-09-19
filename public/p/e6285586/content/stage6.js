// @ts-check
/**
 * Stage 6 — the final stage. Six areas, from the stage's Area1..Area6 map
 * directories, ending in two boss fights back to back: the human antagonist,
 * then the multi-part mech.
 *
 * The last area is the only one in the game to run two bosses in one script,
 * which is the shape the map directory implies and the recording confirmed —
 * the human fight resolves straight into the mech without a result screen
 * between them.
 */

export const STAGE6 = [
  {
    id: '6-0', stage: 6, area: 1, name: 'HANGAR', par: 58, route: 'hangar',
    script: [
      { say: 'cat.final' },
      { spawn: [['trance', 'z0', 2], ['crisisElite', 'z1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['neoShield', 'z2', 1], ['heavyGun', 'z3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '6-1', stage: 6, area: 2, name: 'LAUNCH BAY', par: 60, route: 'hangar',
    script: [
      { spawn: [['tranceRunner', 'z0', 2], ['neoSoldierRed', 'z1', 2]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'L', window: 1.0 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['giantBit', 'z2', 3], ['crisisElite', 'z3', 2]] },
      { caution: 'R', window: 2.8, bonus: 'side' },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['neoShield', 'z4', 1], ['trance', 'z5', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '6-2', stage: 6, area: 3, name: 'ELEVATOR', par: 58, route: 'foundry',
    script: [
      { spawn: [['crisisElite', 'y0', 2], ['tranceRunner', 'y1', 2]] },
      { hold: 'clear' },
      { event: 'crisis', markers: 12, window: 12 },
      { time: +14, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['squadSeeker', 'y2', 3], ['neoShield', 'y3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '6-3', stage: 6, area: 4, name: 'CATAPULT', par: 62, route: 'deck',
    script: [
      { spawn: [['trance', 'd0', 2], ['crisisElite', 'd1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['heavyGun', 'd2', 1], ['tranceRunner', 'd3', 2]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'R', window: 0.95 },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['neoShield', 'd4', 1], ['crisisElite', 'd5', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '6-4', stage: 6, area: 5, name: 'FLIGHT DECK', par: 65, route: 'deck',
    script: [
      { spawn: [['tranceRunner', 'd0', 3], ['squadSeeker', 'd1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['enemyUAH', 'd3', 1], ['crisisElite', 'd2', 2]] },
      { hold: 'clear' },
      { event: 'move', slot: 'R2', window: 2.4 },
      { time: +14, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['heavyGun', 'd4', 1], ['neoShield', 'd5', 1], ['trance', 'd4', 2]] },
      { hold: 'clear' },
      { time: +14, open: ['L2L3', 'L2R3', 'R2R3', 'R2L3'] },
      { spawn: [['giantBit', 'd6', 4]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '6-5', stage: 6, area: 6, name: 'THE VAULT', par: 90, route: 'bossArena',
    script: [
      { say: 'cat.traitor' },
      { spawn: [['neoShield', 'g0', 1], ['tranceRunner', 'g1', 2]] },
      { hold: 'clear' },
      { time: +20 },
      // Two fights back to back with no result screen between them — the only
      // area in the game that runs a second boss.
      { boss: 'robert' },
      { say: 'cat.giant' },
      { time: +25 },
      { boss: 'irongiant' },
      { done: true },
    ],
  },
];

export default STAGE6;

export function selfTest(ok) {
  ok('stage 6 has the six recovered areas', STAGE6.length === 6);
  ok('area numbers run 1 to 6', STAGE6.every((a, i) => a.area === i + 1));
  ok('every id follows stage-index form', STAGE6.every((a, i) => a.id === `6-${i}`));
  ok('every script terminates', STAGE6.every((a) => a.script.some((b) => b.done || b.boss)));
  ok('every script blocks somewhere',
    STAGE6.every((a) => a.script.some((b) => b.hold !== undefined || b.boss || b.event)));

  // The finale runs two bosses in one area, which nothing else does.
  const finale = STAGE6[5].script.filter((b) => b.boss).map((b) => b.boss);
  ok('the last area runs two bosses back to back', finale.length === 2);
  ok('the human fight comes before the mech',
    finale[0] === 'robert' && finale[1] === 'irongiant');
  ok('no other area runs more than one boss',
    STAGE6.slice(0, 5).every((a) => a.script.filter((b) => b.boss).length === 0));
  ok('the finale gets the longest clock in the game',
    STAGE6[5].par === 90 && STAGE6[5].par === Math.max(...STAGE6.map((a) => a.par)));

  // Difficulty floor: only the hardest tiers remain.
  const kinds = new Set();
  for (const a of STAGE6) {
    for (const b of a.script) for (const s of b.spawn || []) kinds.add(s[0].split('@')[0]);
  }
  ok('no plain soldier tier survives to the final stage',
    !['soldierBlue', 'soldierRed', 'soldierYellow', 'soldierBlack'].some((k) => kinds.has(k)));
  ok('drones escort the final stage',
    kinds.has('giantBit') || kinds.has('squadSeeker'));
  ok('the drugged tier and elites carry it',
    kinds.has('tranceRunner') && kinds.has('crisisElite'));

  // Events stay dense right to the end.
  const events = STAGE6.flatMap((a) => a.script.filter((b) => b.event).map((b) => b.event));
  ok('events run through the final stage', events.length >= 4);
  ok('evade, crisis and move all appear',
    events.includes('evade') && events.includes('crisis') && events.includes('move'));

  ok('par times climb toward the finale', STAGE6[4].par > STAGE6[0].par);
}
