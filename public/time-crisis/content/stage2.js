// @ts-check
/**
 * Stage 2 — train, refinery, parking structure.
 *
 * The area list is recovered rather than invented: the stage's Wwise sequence
 * names run Train1, Area1End, Train2, PlantEntrance, PlantCenter, PlantExit,
 * Train3, WildDog, ConnectionRoad, Parking1, Parking2. That is ten distinct
 * areas once the "Area1End" explain beat is folded into Train1, which is how it
 * is treated here.
 *
 * The recording confirmed the set pieces: carriage exteriors, a mounted-gun
 * section with an infinity ammo readout, and an attack helicopter.
 *
 * Difficulty picks up where stage 1 left off — shields and crisis shooters are
 * assumed known, so this stage introduces the armoured tiers, emplacements and
 * the first vehicle targets.
 */

export const STAGE2 = [
  {
    id: '2-0', stage: 2, area: 1, name: 'TRAIN 1', par: 48, route: 'trainRoof',
    script: [
      { say: 'cat.boarding' },
      { spawn: [['soldierRed', 'h0', 2], ['soldierYellow', 'h1', 1]] },
      { hold: 'clear' },
      { time: +10, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['soldierYellow', 'h2', 2], ['shieldSoldier', 'h3', 1]] },
      { hold: 'clear' },
      { time: +10, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['soldierBlack', 'h4', 2], ['crisisShooter', 'h5', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-1', stage: 2, area: 2, name: 'TRAIN 2', par: 50, route: 'trainRoof',
    script: [
      { spawn: [['soldierYellow', 'h0', 2], ['soldierBlack', 'h1', 1]] },
      { hold: 'clear' },
      { time: +10, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['sentrySoldier', 'h2', 1], ['soldierRed@machinegun', 'h3', 1]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'R', window: 1.1 },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['crisisShooter', 'h4', 2], ['shieldSoldier', 'h5', 1]] },
      { caution: 'L', window: 3.0, bonus: 'side' },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-2', stage: 2, area: 3, name: 'PLANT ENTRANCE', par: 50, route: 'plantFloor',
    script: [
      { say: 'cat.refinery' },
      { spawn: [['soldierBlack', 'j0', 2], ['soldierYellow', 'j1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      // First elevated emplacement in the stage.
      { spawn: [['turretSoldier', 'j3', 1], ['soldierRed', 'j2', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-3', stage: 2, area: 4, name: 'PLANT CENTRE', par: 55, route: 'plantFloor',
    script: [
      { spawn: [['shieldSoldier', 'j0', 1], ['crisisShooter', 'j1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { say: 'cat.heavyGun' },
      { spawn: [['heavyGun', 'j3', 1], ['soldierBlack', 'j2', 2]] },
      { caution: 'R', window: 3.2, bonus: 'side' },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['explodable', 'j4', 2], ['soldierYellow', 'j5', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-4', stage: 2, area: 5, name: 'PLANT EXIT', par: 50, route: 'plantFloor',
    script: [
      { spawn: [['soldierBlack', 'j0', 2], ['shieldSoldierRed', 'j1', 1]] },
      { hold: 'clear' },
      { event: 'crisis', markers: 8, window: 12 },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['crisisElite', 'j2', 1], ['soldierBlack@shotgun', 'j3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-5', stage: 2, area: 6, name: 'TRAIN 3', par: 52, route: 'trainRoof',
    script: [
      { spawn: [['soldierBlack', 'h0', 2], ['crisisShooter', 'h1', 2]] },
      { hold: 'clear' },
      { time: +10, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      // The recording's mounted-gun section: a helicopter engaged from the train.
      { say: 'cat.chopper' },
      { spawn: [['enemyHeli', 'h3', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['soldierBlack', 'h4', 2], ['shieldSoldierRed', 'h5', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-6', stage: 2, area: 7, name: 'WILD DOG', par: 70, route: 'bossArena',
    script: [
      { say: 'cat.wildDog' },
      { spawn: [['soldierBlack', 'g0', 2], ['soldierBlack', 'g1', 2]] },
      { hold: 'clear' },
      { time: +20 },
      { boss: 'wilddog' },
      { done: true },
    ],
  },

  {
    id: '2-7', stage: 2, area: 8, name: 'CONNECTION ROAD', par: 50, route: 'connectionRoad',
    script: [
      { spawn: [['riderBlue', 'k0', 2], ['riderRed', 'k1', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['riderBlack', 'k2', 2], ['enemyVehicle', 'k3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-8', stage: 2, area: 9, name: 'PARKING 1', par: 52, route: 'parking',
    script: [
      { spawn: [['soldierBlack', 'm0', 2], ['crisisElite', 'm1', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['shieldSoldierRed', 'm2', 1], ['turretSoldier', 'm3', 1]] },
      { caution: 'L', window: 3.0, bonus: 'side' },
      { hold: 'clear' },
      { time: +10, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['soldierBlack@grenade', 'm4', 1], ['crisisShooter', 'm5', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '2-9', stage: 2, area: 10, name: 'PARKING 2', par: 65, route: 'parking',
    script: [
      { spawn: [['crisisElite', 'm0', 2], ['shieldSoldierRed', 'm1', 1]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'L', window: 1.1 },
      { time: +14, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['heavyGun', 'm2', 1], ['soldierBlack', 'm3', 2]] },
      { hold: 'clear' },
      { time: +16, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { say: 'cat.airSupport' },
      { spawn: [['enemyUAH', 'm5', 1]] },
      { boss: 'uah' },
      { done: true },
    ],
  },
];

export default STAGE2;

export function selfTest(ok) {
  ok('stage 2 has the ten recovered areas', STAGE2.length === 10);
  ok('area numbers run 1 to 10, matching the sequence labels',
    STAGE2.every((a, i) => a.area === i + 1));
  ok('every id follows stage-index form',
    STAGE2.every((a, i) => a.id === `2-${i}`));
  ok('every area names a route and a par time',
    STAGE2.every((a) => !!a.route && a.par > 0));
  ok('every script terminates',
    STAGE2.every((a) => a.script.some((b) => b.done || b.boss)));
  ok('every script blocks somewhere',
    STAGE2.every((a) => a.script.some((b) => b.hold !== undefined || b.boss || b.event)));

  // The three recovered train areas are present and use the train route.
  const trains = STAGE2.filter((a) => a.name.startsWith('TRAIN'));
  ok('three train areas, as the sequence names give', trains.length === 3);
  ok('train areas use the carriage route', trains.every((a) => a.route === 'trainRoof'));

  // Refinery block, in the recovered order.
  ok('the plant runs entrance, centre, exit in order',
    STAGE2[2].name === 'PLANT ENTRANCE' && STAGE2[3].name === 'PLANT CENTRE' &&
    STAGE2[4].name === 'PLANT EXIT');

  // Stage 2 opens above stage 1's floor: no blue tier anywhere.
  const kinds = new Set();
  for (const a of STAGE2) {
    for (const b of a.script) for (const s of b.spawn || []) kinds.add(s[0].split('@')[0]);
  }
  ok('the weakest tier is left behind in stage 1', !kinds.has('soldierBlue'));
  ok('armoured and elite tiers carry the stage',
    kinds.has('soldierBlack') && kinds.has('crisisElite'));
  ok('vehicles appear, as the recording showed',
    kinds.has('enemyHeli') || kinds.has('enemyUAH'));
  ok('riders appear on the connection road', kinds.has('riderBlack'));

  // Two bosses in this stage, both defined.
  const bosses = STAGE2.flatMap((a) => a.script.filter((b) => b.boss).map((b) => b.boss));
  ok('the stage carries Wild Dog and the helicopter',
    bosses.includes('wilddog') && bosses.includes('uah'));
  ok('boss areas get the longest clocks',
    STAGE2[6].par >= 65 && STAGE2[9].par >= 65);

  ok('carriers drop across the stage',
    STAGE2.filter((a) => a.script.some((b) =>
      (b.spawn || []).some((s) => s[0].includes('@')))).length >= 3);
  ok('a crisis event appears', STAGE2.some((a) => a.script.some((b) => b.event === 'crisis')));
}
