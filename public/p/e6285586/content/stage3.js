// @ts-check
/**
 * Stage 3 — highway pursuit, truck convoy, half-pipe, and the walker.
 *
 * Area list recovered from the stage's sequence labels: Bike1, Bike2, Truck1,
 * Truck2, Truck3, Crisis, HarfPipe1, HarfPipe2, Renzoku1, Renzoku2, Move.
 * Eleven areas. "Renzoku" is 連続 — consecutive — and names the two back-to-back
 * chain waves; the original's "HarfPipe" spelling is kept only in the notes,
 * not in the display names.
 *
 * This is the vehicle stage, so it leans on events rather than on new enemy
 * tiers: an explicit crisis area, evades through the pursuit, and a move event
 * to close it out before the boss.
 */

export const STAGE3 = [
  {
    id: '3-0', stage: 3, area: 1, name: 'BIKE 1', par: 45, route: 'highway',
    script: [
      { say: 'cat.pursuit' },
      { spawn: [['riderBlue', 'n0', 2], ['riderRed', 'n1', 1]] },
      { hold: 'clear' },
      { time: +10, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['riderRed', 'n2', 2], ['riderBlack', 'n3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-1', stage: 3, area: 2, name: 'BIKE 2', par: 48, route: 'highway',
    script: [
      { spawn: [['riderBlack', 'n0', 2], ['riderRed', 'n1', 2]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'R', window: 1.1 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['riderBlack', 'n2', 2], ['enemyVehicle', 'n3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-2', stage: 3, area: 3, name: 'TRUCK 1', par: 48, route: 'truckBed',
    script: [
      { say: 'cat.onBoard' },
      { spawn: [['soldierBlack', 'q0', 2], ['soldierYellow', 'q1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisShooter', 'q2', 2], ['sentrySoldier', 'q3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-3', stage: 3, area: 4, name: 'TRUCK 2', par: 50, route: 'truckBed',
    script: [
      { spawn: [['shieldSoldierRed', 'q0', 1], ['soldierBlack', 'q1', 2]] },
      { hold: 'clear' },
      { caution: 'L', window: 3.0, bonus: 'side' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['turretSoldier', 'q3', 1], ['crisisElite', 'q2', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-4', stage: 3, area: 5, name: 'TRUCK 3', par: 52, route: 'truckBed',
    script: [
      { spawn: [['crisisElite', 'q0', 2], ['soldierBlack@machinegun', 'q1', 1]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'L', window: 1.05 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['heavyGun', 'q3', 1], ['soldierBlack', 'q2', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-5', stage: 3, area: 6, name: 'CRISIS', par: 55, route: 'chainRun',
    script: [
      { say: 'cat.markers' },
      // The area the sequence label names outright — a crisis event is the point.
      { event: 'crisis', markers: 10, window: 12 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisElite', 'v2', 2], ['crisisShooter', 'v3', 2]] },
      { hold: 'clear' },
      { event: 'crisis', markers: 8, window: 10 },
      { done: true },
    ],
  },

  {
    id: '3-6', stage: 3, area: 7, name: 'HALF-PIPE 1', par: 50, route: 'halfPipe',
    script: [
      { spawn: [['riderBlack', 'u0', 2], ['soldierBlack', 'u1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisElite', 'u2', 2], ['shieldSoldierRed', 'u3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-7', stage: 3, area: 8, name: 'HALF-PIPE 2', par: 52, route: 'halfPipe',
    script: [
      { spawn: [['soldierBlack', 'u0', 2], ['turretSoldier', 'u1', 1]] },
      { hold: 'clear' },
      { caution: 'R', window: 3.0, bonus: 'side' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['heavyGun', 'u2', 1], ['crisisElite', 'u3', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['enemyVehicle', 'u4', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-8', stage: 3, area: 9, name: 'CHAIN RUN 1', par: 55, route: 'chainRun',
    script: [
      // Renzoku: waves land back to back, each opening the next node as it clears.
      { spawn: [['soldierBlack', 'v0', 2], ['crisisShooter', 'v1', 2]] },
      { hold: 'clear' },
      { time: +8, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisElite', 'v2', 2], ['shieldSoldierRed', 'v3', 1]] },
      { hold: 'clear' },
      { time: +8, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['soldierBlack@shotgun', 'v4', 1], ['crisisElite', 'v5', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-9', stage: 3, area: 10, name: 'CHAIN RUN 2', par: 58, route: 'chainRun',
    script: [
      { spawn: [['crisisElite', 'v0', 2], ['turretSoldier', 'v1', 1]] },
      { hold: 'clear' },
      { time: +8, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['heavyGun', 'v2', 1], ['soldierBlack', 'v3', 2]] },
      { caution: 'L', window: 2.8, bonus: 'side' },
      { hold: 'clear' },
      { time: +8, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['crisisElite', 'v4', 2], ['shieldSoldierRed', 'v5', 1]] },
      { hold: 'clear' },
      { time: +8, open: ['L2L3', 'L2R3', 'R2R3', 'R2L3'] },
      { spawn: [['soldierBlack', 'v6', 2], ['crisisElite', 'v7', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '3-10', stage: 3, area: 11, name: 'MOVE', par: 70, route: 'bossArena',
    script: [
      { say: 'cat.walker' },
      { spawn: [['soldierBlack', 'g0', 2], ['crisisElite', 'g1', 2]] },
      { hold: 'clear' },
      { event: 'move', slot: 'R0', window: 2.4 },
      { time: +20 },
      { boss: 'mlt' },
      { done: true },
    ],
  },
];

export default STAGE3;

export function selfTest(ok) {
  ok('stage 3 has the eleven recovered areas', STAGE3.length === 11);
  ok('area numbers run 1 to 11', STAGE3.every((a, i) => a.area === i + 1));
  ok('every id follows stage-index form', STAGE3.every((a, i) => a.id === `3-${i}`));
  ok('every area names a route and a par time',
    STAGE3.every((a) => !!a.route && a.par > 0));
  ok('every script terminates', STAGE3.every((a) => a.script.some((b) => b.done || b.boss)));
  ok('every script blocks somewhere',
    STAGE3.every((a) => a.script.some((b) => b.hold !== undefined || b.boss || b.event)));

  // The recovered structure: two bike areas, three trucks, two half-pipes,
  // two chain runs, a crisis area and a move area.
  const named = (p) => STAGE3.filter((a) => a.name.startsWith(p)).length;
  ok('two bike areas', named('BIKE') === 2);
  ok('three truck areas', named('TRUCK') === 3);
  ok('two half-pipe areas', named('HALF-PIPE') === 2);
  ok('two chain-run areas', named('CHAIN RUN') === 2);
  ok('a crisis area and a move area', named('CRISIS') === 1 && named('MOVE') === 1);

  ok('bike areas use the highway route',
    STAGE3.filter((a) => a.name.startsWith('BIKE')).every((a) => a.route === 'highway'));
  ok('truck areas use the truck bed',
    STAGE3.filter((a) => a.name.startsWith('TRUCK')).every((a) => a.route === 'truckBed'));

  // This is the event stage, so events should be dense.
  const events = STAGE3.flatMap((a) => a.script.filter((b) => b.event).map((b) => b.event));
  ok('the stage is event-heavy', events.length >= 5);
  ok('all three event kinds appear',
    events.includes('evade') && events.includes('crisis') && events.includes('move'));
  ok('the crisis area actually runs crisis events',
    STAGE3[5].script.filter((b) => b.event === 'crisis').length === 2);

  // Chain runs must escalate: the second is longer than the first.
  const waves = (a) => a.script.filter((b) => b.spawn).length;
  ok('the second chain run is longer than the first',
    waves(STAGE3[9]) > waves(STAGE3[8]));
  ok('chain runs walk the full four-node rail',
    STAGE3[9].script.some((b) => (b.open || []).some((e) => e.includes('3'))));

  // Difficulty floor: stage 3 sits above stage 2.
  const kinds = new Set();
  for (const a of STAGE3) {
    for (const b of a.script) for (const s of b.spawn || []) kinds.add(s[0].split('@')[0]);
  }
  ok('the weakest tiers are long gone',
    !kinds.has('soldierBlue') && !kinds.has('soldierRed'));
  ok('elite crisis shooters carry the stage', kinds.has('crisisElite'));
  ok('riders appear, as the pursuit needs', kinds.has('riderBlack'));

  ok('only the last area runs a boss',
    STAGE3.filter((a) => a.script.some((b) => b.boss)).length === 1 &&
    STAGE3[10].script.some((b) => b.boss === 'mlt'));
  ok('the boss area gets the longest clock',
    STAGE3[10].par === Math.max(...STAGE3.map((a) => a.par)));
}
