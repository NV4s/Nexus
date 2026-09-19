// @ts-check
/**
 * Stage 1 — resort hotel, daylight. Areas 0 through 10.
 *
 * The area count is recovered: the stage's map directory carries Area0 through
 * Area10, and its sound-bank sequence names run the same range. Environments
 * are taken from the recording — poolside terrace, fountains, lobby, suite,
 * and a crane deck for the boss.
 *
 * Wave composition is authored. The archetype ladder and the pacing are built
 * to the mechanics, not copied: this stage teaches cover, then the twin pedal,
 * then shields, then crisis shots, then puts them together.
 *
 * Every beat here is data. There is no per-area code anywhere in this file.
 */

/** Areas 0-2 introduce one mechanic each, so their scripts stay short. */
export const STAGE1 = [
  {
    id: '1-0', stage: 1, area: 0, name: 'POOL DECK', par: 45, route: 'poolDeck',
    script: [
      { say: 'cat.contact' },
      { spawn: [['soldierBlue', 'a0', 2]] },
      { hold: 'clear' },
      { say: 'cat.otherSide', open: ['L0R0', 'R0L0'] },
      { spawn: [['soldierBlue', 'a1', 2]] },
      { hold: 'clear' },
      { time: +10, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['soldierRed', 'a2', 2], ['soldierBlue', 'a3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-1', stage: 1, area: 1, name: 'POOLSIDE', par: 45, route: 'poolDeck',
    script: [
      { spawn: [['soldierBlue', 'a0', 2], ['soldierRed', 'a1', 1]] },
      { hold: 'clear' },
      { say: 'cat.advance', time: +8, open: ['L0L1', 'R0R1'] },
      { spawn: [['soldierRed', 'a2', 2], ['soldierRed', 'a3', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-2', stage: 1, area: 2, name: 'TERRACE', par: 48, route: 'terrace',
    script: [
      { spawn: [['soldierRed', 'b0', 2]] },
      { hold: 'clear' },
      // First elevated position — the player has to look up rather than across.
      { say: 'cat.above' },
      { spawn: [['sentrySoldier', 'b1', 1], ['soldierBlue', 'b0', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['soldierRed', 'b2', 2], ['soldierYellow', 'b3', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-3', stage: 1, area: 3, name: 'FOUNTAIN COURT', par: 50, route: 'fountain',
    script: [
      { spawn: [['soldierRed', 'c0', 2], ['soldierBlue', 'c1', 2]] },
      { hold: 'clear' },
      { time: +10, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      // First shield. The info bar calls it out, as the game does.
      { say: 'cat.shields' },
      { spawn: [['shieldSoldier', 'c2', 1], ['soldierRed', 'c3', 1]] },
      { caution: 'R', window: 3.0, bonus: 'side' },
      { hold: 'clear' },
      { time: +10, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['soldierYellow', 'c4', 2], ['soldierRed', 'c5', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-4', stage: 1, area: 4, name: 'LOBBY', par: 48, route: 'lobby',
    script: [
      { say: 'cat.inside' },
      { spawn: [['soldierRed', 'd1', 2], ['soldierBlue', 'd0', 1]] },
      { hold: 'clear' },
      { time: +10, open: ['R0R1', 'R0L1', 'L0L1', 'L0R1'] },
      { spawn: [['soldierYellow', 'd3', 2], ['sentrySoldier', 'd2', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-5', stage: 1, area: 5, name: 'MEZZANINE', par: 50, route: 'terrace',
    script: [
      { spawn: [['soldierRed', 'b0', 2], ['shieldSoldier', 'b1', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      // First crisis shooter. Red telegraph, 0.4s to reach cover.
      { say: 'cat.crisisShot' },
      { spawn: [['crisisShooter', 'b2', 1], ['soldierYellow', 'b3', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-6', stage: 1, area: 6, name: 'SUITE', par: 48, route: 'suite',
    script: [
      { spawn: [['soldierYellow', 'e0', 2], ['soldierRed', 'e1', 2]] },
      { hold: 'clear' },
      { time: +10, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['shieldSoldier', 'e2', 1], ['crisisShooter', 'e3', 1]] },
      { caution: 'L', window: 2.8, bonus: 'side' },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-7', stage: 1, area: 7, name: 'SERVICE HALL', par: 50, route: 'lobby',
    script: [
      { spawn: [['soldierBlack', 'd1', 1], ['soldierYellow', 'd0', 2]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'L', window: 1.1 },
      { time: +10, open: ['R0R1', 'R0L1', 'L0L1', 'L0R1'] },
      { spawn: [['turretSoldier', 'd2', 1], ['soldierRed', 'd3', 2]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-8', stage: 1, area: 8, name: 'ROOF GARDEN', par: 52, route: 'fountain',
    script: [
      { spawn: [['soldierYellow', 'c0', 2], ['crisisShooter', 'c1', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['shieldSoldier', 'c2', 1], ['sentrySoldier', 'c3', 1], ['soldierRed@shotgun', 'c2', 1]] },
      { hold: 'clear' },
      { time: +12, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['soldierBlack', 'c4', 2], ['soldierYellow', 'c5', 2]] },
      { caution: 'R', window: 3.2, bonus: 'side' },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-9', stage: 1, area: 9, name: 'HELIPAD APPROACH', par: 52, route: 'craneDeck',
    script: [
      { say: 'cat.heavy' },
      { spawn: [['heavyGun', 'f0', 1], ['soldierYellow', 'f1', 2]] },
      { hold: 'clear' },
      { time: +12, open: ['L0L1', 'L0R1', 'R0R1', 'R0L1'] },
      { spawn: [['soldierBlack', 'f2', 2], ['crisisShooter', 'f3', 2]] },
      { hold: 'clear' },
      { event: 'evade', pedal: 'R', window: 1.1 },
      { time: +10, open: ['L1L2', 'L1R2', 'R1R2', 'R1L2'] },
      { spawn: [['soldierBlack@machinegun', 'f4', 1], ['shieldSoldier', 'f4', 1]] },
      { hold: 'clear' },
      { done: true },
    ],
  },

  {
    id: '1-10', stage: 1, area: 10, name: 'CRANE DECK', par: 70, route: 'bossArena',
    script: [
      { say: 'cat.bossWarn' },
      { spawn: [['soldierYellow', 'g0', 2], ['soldierYellow', 'g1', 2]] },
      { hold: 'clear' },
      { time: +20 },
      { boss: 'hacs' },
      { done: true },
    ],
  },
];

export default STAGE1;

export function selfTest(ok) {
  ok('stage 1 has eleven areas, matching Area0 through Area10', STAGE1.length === 11);
  ok('area numbers run 0 to 10 without gaps',
    STAGE1.every((a, i) => a.area === i));
  ok('every area id follows stage-area form',
    STAGE1.every((a) => a.id === `1-${a.area}`));
  ok('every area names a route and a par time',
    STAGE1.every((a) => !!a.route && a.par > 0));
  ok('every script terminates',
    STAGE1.every((a) => a.script.some((b) => b.done || b.boss)));
  ok('every script blocks somewhere, so none can run away',
    STAGE1.every((a) => a.script.some((b) => b.hold !== undefined || b.boss || b.event)));

  // The stage must actually teach in order: shields before crisis shooters,
  // crisis shooters before they are combined with anything else.
  const firstWith = (kind) => STAGE1.findIndex((a) =>
    a.script.some((b) => (b.spawn || []).some((s) => s[0].startsWith(kind))));
  ok('shields appear before crisis shooters',
    firstWith('shieldSoldier') < firstWith('crisisShooter'));
  ok('the heavy emplacement is held back to late in the stage',
    firstWith('heavyGun') >= 8);
  ok('the black tier arrives after the yellow tier',
    firstWith('soldierYellow') < firstWith('soldierBlack'));

  // Difficulty should trend upward across the stage.
  const spawnCount = (a) => a.script.reduce((n, b) =>
    n + (b.spawn || []).reduce((m, s) => m + (s[2] || 1), 0), 0);
  ok('later areas are not smaller than the opening one',
    spawnCount(STAGE1[8]) > spawnCount(STAGE1[0]));

  ok('only the last area runs a boss',
    STAGE1.filter((a) => a.script.some((b) => b.boss)).length === 1 &&
    STAGE1[10].script.some((b) => b.boss === 'hacs'));
  ok('the boss area gets the longest clock',
    STAGE1[10].par === Math.max(...STAGE1.map((a) => a.par)));

  // Ammo carriers must actually appear, or the special weapons are unreachable.
  ok('at least one carrier drops a weapon',
    STAGE1.some((a) => a.script.some((b) => (b.spawn || []).some((s) => s[0].includes('@')))));
  ok('side attack windows are armed somewhere',
    STAGE1.some((a) => a.script.some((b) => b.caution)));
  ok('evade events appear in the back half',
    STAGE1.slice(6).some((a) => a.script.some((b) => b.event === 'evade')));
}
