// @ts-check
/**
 * Boss definitions. Data only — the runner in sim/boss.js is the whole
 * implementation, and nothing here is code.
 *
 * Each entry records what was actually observed in the recording: how many
 * phases the gauge counted down, which parts the info bar called out, whether
 * a part auto-repairs, and whether armour resists small-arms fire. Hitpoint
 * numbers are invented — they are compressed inside TimeCrisisGame.u and are
 * not recoverable — but the structure around them is not.
 *
 * `box` is [centreX, centreY, width, height] in body-relative units.
 * `gate` lists the phase indices in which a part is exposed.
 * `repair` is seconds until a destroyed part returns, or null for permanent.
 */

export const BOSSES = {
  /**
   * Stage 1. Paired powered-armour units with thrusters. The info bar calls
   * out a weak point, which the series has traditionally put on the back —
   * hence the flank-gated tank.
   */
  hacs: {
    id: 'hacs', name: 'H.A.C.S.', stage: 1, hp: 900, draw: 'hacs',
    parts: [
      { id: 'tank', hp: 140, weak: true, box: [0, -0.30, 0.46, 0.34], gate: [0, 1, 2], repair: null },
      { id: 'armL', hp: 90, weak: false, box: [-0.72, 0.02, 0.30, 0.52], gate: [1, 2], repair: 14 },
      { id: 'vent', hp: 70, weak: true, box: [0, 0.26, 0.34, 0.24], gate: [2], repair: null },
    ],
    phases: [
      { at: 1.00, lock: true, attacks: ['sweep', 'rocket'],
        script: [{ say: 'boss.hacsEnter' }] },
      { at: 0.62, lock: true, attacks: ['sweep', 'rocket', 'hipLaser'],
        script: [{ say: 'boss.hacsWeak' }, { caution: 'R', window: 3.2, bonus: 'side' }] },
      { at: 0.28, lock: false, attacks: ['hipLaser', 'barrage'],
        script: [{ spawn: [['soldierYellow', 'g0', 2]] }] },
    ],
    attacks: {
      sweep:    { cd: [2.4, 3.6], beats: [{ tell: 0.9 }, { fire: { n: 4, red: false } }] },
      rocket:   { cd: [3.2, 5.0], beats: [{ tell: 1.2, shake: 6 }, { fire: { n: 1, red: true } }] },
      hipLaser: { cd: [3.0, 4.4], beats: [{ tell: 1.4 }, { fire: { n: 2, red: true } }] },
      barrage:  { cd: [4.0, 6.0], beats: [{ tell: 0.7 }, { fire: { n: 8, spread: 0.4 } }] },
    },
  },

  /**
   * Multi-legged walker. Two observations drive this one: the gauge numeral
   * counted 2 then 1, and the info bar warned that the rocket launcher on the
   * body section auto-repairs.
   */
  mlt: {
    id: 'mlt', name: 'MLT', stage: 3, hp: 1400, draw: 'mlt',
    parts: [
      { id: 'rocket', hp: 120, weak: false, box: [0.10, -0.22, 0.40, 0.30], gate: [0, 1], repair: 12 },
      { id: 'hatch', hp: 160, weak: true, box: [0, 0.06, 0.36, 0.28], gate: [1], repair: null },
      { id: 'cannonL', hp: 100, weak: false, box: [-0.66, -0.10, 0.28, 0.30], gate: [0, 1], repair: 18 },
      { id: 'core', hp: 200, weak: true, box: [0, -0.02, 0.30, 0.26], gate: [1], repair: null },
    ],
    phases: [
      { at: 1.00, lock: true, attacks: ['subCannon', 'missile'],
        script: [{ say: 'boss.mltEnter' }] },
      { at: 0.50, lock: false, attacks: ['subCannon', 'missile', 'seeker'],
        script: [{ say: 'boss.mltRepair' }] },
    ],
    attacks: {
      subCannon: { cd: [2.0, 3.2], beats: [{ tell: 1.0 }, { fire: { n: 3 } }] },
      missile:   { cd: [3.4, 5.2], beats: [{ tell: 1.5, shake: 8 }, { fire: { n: 2, red: true } }] },
      seeker:    { cd: [5.0, 7.0], beats: [{ tell: 1.1 }, { spawn: [['seeker', 'gb', 2]] }] },
    },
  },

  /** Unmanned attack helicopter. Airborne, fought from a mounted gun. */
  uah: {
    id: 'uah', name: 'UAH', stage: 2, hp: 600, draw: 'uah',
    parts: [
      { id: 'rotor', hp: 90, weak: true, box: [0, -0.42, 0.62, 0.18], gate: [0, 1], repair: null },
      { id: 'pod', hp: 70, weak: false, box: [0.52, 0.04, 0.26, 0.24], gate: [0], repair: 10 },
    ],
    phases: [
      { at: 1.00, lock: true, attacks: ['strafe'], script: [{ say: 'boss.uahEnter' }] },
      { at: 0.45, lock: false, attacks: ['strafe', 'rockets'] },
    ],
    attacks: {
      strafe:  { cd: [1.8, 2.8], beats: [{ tell: 0.8 }, { fire: { n: 5, spread: 0.5 } }] },
      rockets: { cd: [3.6, 5.4], beats: [{ tell: 1.3, shake: 7 }, { fire: { n: 2, red: true } }] },
    },
  },

  /** Wild Dog. Tractor beam, and undefended spots the info bar points out. */
  wilddog: {
    id: 'wilddog', name: 'Wild Dog', stage: 2, hp: 1100, draw: 'wilddog',
    parts: [
      { id: 'armWeapon', hp: 110, weak: false, box: [0.58, -0.04, 0.30, 0.30], gate: [0, 1], repair: 15 },
      { id: 'chest', hp: 150, weak: true, box: [0, -0.04, 0.32, 0.30], gate: [1, 2], repair: null },
    ],
    phases: [
      { at: 1.00, lock: true, attacks: ['spray'], script: [{ say: 'boss.wdEnter' }] },
      { at: 0.66, lock: true, attacks: ['spray', 'tractor'],
        script: [{ say: 'boss.wdTractor' }] },
      { at: 0.30, lock: false, attacks: ['spray', 'tractor', 'rpg'],
        script: [{ say: 'boss.wdUndefended' }, { caution: 'L', window: 3.0, bonus: 'side' }] },
    ],
    attacks: {
      spray:   { cd: [1.6, 2.6], beats: [{ tell: 0.7 }, { fire: { n: 4 } }] },
      tractor: { cd: [5.0, 7.5], beats: [{ tell: 1.6, shake: 10 }, { fire: { n: 1, red: true } }] },
      rpg:     { cd: [3.4, 5.0], beats: [{ tell: 1.2 }, { fire: { n: 1, red: true } }] },
    },
  },

  /** Keith. Sword and blade work, warp repositioning, four phases. */
  keith: {
    id: 'keith', name: 'Keith Martin', stage: 4, hp: 1300, draw: 'keith',
    parts: [],
    phases: [
      { at: 1.00, lock: true, attacks: ['handgun'], script: [{ say: 'boss.keithEnter' }] },
      { at: 0.75, lock: true, attacks: ['handgun', 'shuriken'], script: [{ warp: 'gb' }] },
      { at: 0.50, lock: true, attacks: ['shuriken', 'slash'], script: [{ warp: 'g0' }] },
      { at: 0.22, lock: false, attacks: ['slash', 'special'], script: [{ warp: 'g1' }] },
    ],
    attacks: {
      handgun:  { cd: [1.4, 2.2], beats: [{ tell: 0.8 }, { fire: { n: 2 } }] },
      shuriken: { cd: [2.0, 3.0], beats: [{ tell: 0.9 }, { fire: { n: 3, red: false } }] },
      slash:    { cd: [3.0, 4.4], beats: [{ tell: 1.1, shake: 6 }, { fire: { n: 1, red: true } }] },
      special:  { cd: [4.4, 6.2], beats: [{ tell: 1.5, shake: 9 }, { fire: { n: 4, red: true } }] },
    },
  },

  /** Wild Fang. Two forms; the second shows a numeric health percentage. */
  wildfang: {
    id: 'wildfang', name: 'Wild Fang', stage: 5, hp: 1500, draw: 'wildfang',
    parts: [
      { id: 'blades', hp: 130, weak: false, box: [0, -0.34, 0.66, 0.22], gate: [0], repair: 16 },
      { id: 'reactor', hp: 190, weak: true, box: [0, 0.02, 0.30, 0.28], gate: [1], repair: null },
    ],
    phases: [
      { at: 1.00, lock: true, attacks: ['rush', 'shot'], script: [{ say: 'boss.wfEnter' }] },
      { at: 0.48, lock: false, attacks: ['rush', 'lightBeam', 'shot'],
        script: [{ say: 'boss.wfForm2' }], showPercent: true },
    ],
    attacks: {
      rush:      { cd: [3.0, 4.6], beats: [{ tell: 1.2, shake: 8 }, { fire: { n: 1, red: true } }] },
      shot:      { cd: [1.8, 2.8], beats: [{ tell: 0.8 }, { fire: { n: 3 } }] },
      lightBeam: { cd: [4.0, 6.0], beats: [{ tell: 1.7 }, { fire: { n: 2, red: true } }] },
    },
  },

  /**
   * Iron Giant. Multi-part and armoured — the info bar warns not to waste
   * bullets on the armour, so only the gated weak parts take real damage.
   */
  irongiant: {
    id: 'irongiant', name: 'Iron Giant', stage: 6, hp: 2200, draw: 'irongiant',
    parts: [
      { id: 'armL', hp: 160, weak: false, box: [-0.74, -0.06, 0.28, 0.44], gate: [0, 1], repair: 20 },
      { id: 'armR', hp: 160, weak: false, box: [0.74, -0.06, 0.28, 0.44], gate: [0, 1], repair: 20 },
      { id: 'face', hp: 120, weak: true, box: [0, -0.40, 0.26, 0.20], gate: [1, 2], repair: null },
      { id: 'core', hp: 260, weak: true, box: [0, 0.00, 0.28, 0.26], gate: [2], repair: null },
      { id: 'legL', hp: 140, weak: false, box: [-0.34, 0.42, 0.24, 0.34], gate: [0], repair: 24 },
    ],
    phases: [
      { at: 1.00, lock: true, attacks: ['gatling', 'missile'],
        script: [{ say: 'boss.igEnter' }] },
      { at: 0.66, lock: true, attacks: ['gatling', 'missile', 'bits'],
        script: [{ say: 'boss.igArmor' }] },
      { at: 0.30, lock: false, attacks: ['beam', 'bits', 'blow'],
        script: [{ say: 'boss.igTransform' }] },
    ],
    attacks: {
      gatling: { cd: [1.6, 2.6], beats: [{ tell: 0.7 }, { fire: { n: 6, spread: 0.4 } }] },
      missile: { cd: [3.2, 4.8], beats: [{ tell: 1.3, shake: 8 }, { fire: { n: 2, red: true } }] },
      bits:    { cd: [5.0, 7.0], beats: [{ tell: 1.0 }, { spawn: [['giantBit', 'gb', 3]] }] },
      beam:    { cd: [4.4, 6.4], beats: [{ tell: 1.8, shake: 12 }, { fire: { n: 1, red: true } }] },
      blow:    { cd: [3.6, 5.2], beats: [{ tell: 1.4, shake: 10 }, { fire: { n: 3, red: true } }] },
    },
  },

  /** Robert. The final human fight, on a carrier deck. */
  robert: {
    id: 'robert', name: 'Robert Baxter', stage: 6, hp: 1000, draw: 'robert',
    parts: [],
    phases: [
      { at: 1.00, lock: true, attacks: ['knife', 'railgun'], script: [{ say: 'boss.robEnter' }] },
      { at: 0.55, lock: true, attacks: ['railgun', 'railgunYellow'],
        script: [{ caution: 'R', window: 2.8, bonus: 'side' }] },
      { at: 0.20, lock: false, attacks: ['railgun', 'knife', 'railgunYellow'] },
    ],
    attacks: {
      knife:         { cd: [2.2, 3.2], beats: [{ tell: 0.9 }, { fire: { n: 2 } }] },
      railgun:       { cd: [3.0, 4.4], beats: [{ tell: 1.4, shake: 7 }, { fire: { n: 1, red: true } }] },
      railgunYellow: { cd: [2.4, 3.6], beats: [{ tell: 1.0 }, { fire: { n: 3 } }] },
    },
  },
};

export const bossById = (id) => BOSSES[id] || null;
export const bossesForStage = (stage) =>
  Object.values(BOSSES).filter((b) => b.stage === stage);

export function selfTest(ok) {
  const all = Object.values(BOSSES);
  ok('all eight bosses are defined', all.length === 8);
  ok('every boss id matches its key',
    Object.entries(BOSSES).every(([k, b]) => b.id === k));
  ok('every boss has health, a name and a draw handle',
    all.every((b) => b.hp > 0 && !!b.name && !!b.draw));

  // Phase thresholds must descend, or a phase can never be reached.
  ok('phase thresholds descend', all.every((b) =>
    b.phases.every((p, i) => i === 0 || p.at < b.phases[i - 1].at)));
  ok('every boss opens at full health', all.every((b) => b.phases[0].at === 1.0));
  ok('the last phase is unlocked, so a boss can actually die',
    all.every((b) => b.phases[b.phases.length - 1].lock === false));

  // Every named attack must exist, or the runner picks a phantom.
  ok('every phase attack resolves to a definition', all.every((b) =>
    b.phases.every((p) => (p.attacks || []).every((a) => !!b.attacks[a]))));
  ok('every attack has beats and a cooldown', all.every((b) =>
    Object.values(b.attacks).every((a) => a.beats.length > 0 && a.cd[0] <= a.cd[1])));
  ok('every attack eventually fires or spawns', all.every((b) =>
    Object.values(b.attacks).every((a) => a.beats.some((x) => x.fire || x.spawn))));

  // Parts.
  const withParts = all.filter((b) => b.parts.length);
  ok('most bosses carry destructible parts', withParts.length >= 6);
  ok('every part has a box of four numbers',
    withParts.every((b) => b.parts.every((p) => p.box.length === 4)));
  ok('part gates reference phases that exist', withParts.every((b) =>
    b.parts.every((p) => (p.gate || []).every((g) => g < b.phases.length))));
  ok('every boss with parts exposes at least one in phase 0', withParts.every((b) =>
    b.parts.some((p) => (p.gate || []).includes(0))));
  ok('weak points exist on the multi-part bosses', withParts.every((b) =>
    b.parts.some((p) => p.weak)));

  // The two behaviours the game's own callouts confirmed.
  ok('the walker has an auto-repairing body weapon',
    BOSSES.mlt.parts.find((p) => p.id === 'rocket').repair > 0);
  ok('the armoured giant has non-weak armour parts',
    BOSSES.irongiant.parts.some((p) => !p.weak && p.repair > 0));
  ok('the giant hides its core until the final phase',
    BOSSES.irongiant.parts.find((p) => p.id === 'core').gate.join() === '2');

  // Observed phase counts.
  ok('the walker gauge counted two phases', BOSSES.mlt.phases.length === 2);
  ok('Keith fights through four phases', BOSSES.keith.phases.length === 4);
  ok('Wild Fang has two forms', BOSSES.wildfang.phases.length === 2);
  ok('Wild Fang form two shows a percentage', BOSSES.wildfang.phases[1].showPercent === true);

  ok('bosses are spread across the stages',
    new Set(all.map((b) => b.stage)).size >= 5);
  ok('lookup by id works', bossById('hacs').name === 'H.A.C.S.');
  ok('an unknown id returns null', bossById('nope') === null);
  ok('stage 1 has exactly one boss', bossesForStage(1).length === 1);
}
