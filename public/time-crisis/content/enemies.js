// @ts-check
/**
 * Enemy archetypes.
 *
 * The roster is recovered from TCPawn_* class names in the shipping executable.
 * The colour tiers (Blue/Red/Yellow/Black) are the series' long-standing threat
 * ladder; the Neo/Trance tier are the drugged soldiers introduced in the later
 * stages, which the tips text says must be taken down with headshots.
 *
 * Health, aim times and scores are NOT recovered — those tables are compressed
 * inside TimeCrisisGame.u. They are authored here to preserve the *ordering*
 * the class names imply: each colour step is meaningfully harder than the last.
 *
 * Fields:
 *   hp        body hitpoints
 *   brain     which action table in sim/brains.js drives it
 *   aim       seconds of telegraph before firing (scaled by difficulty)
 *   armor     0..1 fraction of body damage absorbed (headshots ignore it)
 *   shield    { hp, dir } a front shield that must be broken or flanked
 *   flinch    { rate, str, wait } chance a hit interrupts the current action
 *   red       fires crisis shots (the red-bullet telegraph)
 *   headOnly  body shots barely register; this is a headshot check
 *   static    emplacement, never repositions
 *   flying    drone; ignores ground plane, drifts
 *   scale     draw size multiplier
 */

export const ENEMIES = {
  /* ---- standard infantry ladder ---- */
  soldierBlue: {
    hp: 1, brain: 'soldier', aim: 1.75, score: 300, color: '#5c7f9e', scale: 1.0,
    flinch: { rate: 0.6, str: 1, wait: 0.35 },
  },
  soldierRed: {
    hp: 2, brain: 'soldier', aim: 1.45, score: 500, color: '#9e5c5c', scale: 1.02,
    flinch: { rate: 0.5, str: 1, wait: 0.35 },
  },
  soldierYellow: {
    hp: 2, brain: 'elite', aim: 1.2, score: 700, color: '#9e8d4c', scale: 1.04,
    flinch: { rate: 0.4, str: 1, wait: 0.4 },
  },
  soldierBlack: {
    hp: 3, brain: 'elite', aim: 1.05, score: 900, color: '#3f4550', scale: 1.06, armor: 0.4,
    flinch: { rate: 0.3, str: 1, wait: 0.5 },
  },

  /* ---- shielded ---- */
  shieldSoldier: {
    hp: 3, brain: 'shield', aim: 1.6, score: 1200, color: '#6b7a6b', scale: 1.08,
    shield: { hp: 6, dir: 'front' },
    flinch: { rate: 0.25, str: 1, wait: 0.45 },
  },
  shieldSoldierRed: {
    hp: 4, brain: 'shield', aim: 1.35, score: 1500, color: '#8a5a52', scale: 1.1,
    shield: { hp: 10, dir: 'front' },
    flinch: { rate: 0.2, str: 1, wait: 0.5 },
  },

  /* ---- emplacements ---- */
  sentrySoldier: {
    hp: 2, brain: 'soldier', aim: 2.1, score: 600, color: '#4f6070', scale: 1.0, static: true,
    flinch: { rate: 0.5, str: 1, wait: 0.4 },
  },
  turretSoldier: {
    hp: 4, brain: 'heavyGun', aim: 1.1, score: 1400, color: '#55504a', scale: 1.15,
    static: true, armor: 0.3,
    flinch: { rate: 0.2, str: 1, wait: 0.5 },
  },
  heavyGun: {
    hp: 8, brain: 'heavyGun', aim: 0.9, score: 2000, color: '#6b5a45', scale: 1.3,
    static: true, armor: 0.6, suppress: true,
    flinch: { rate: 0.15, str: 1, wait: 0.6 },
  },

  /* ---- crisis shooters: the red-bullet carriers ---- */
  crisisShooter: {
    hp: 1, brain: 'attacker', aim: 1.1, score: 1200, color: '#8b2233', scale: 1.0, red: true,
    flinch: { rate: 0.5, str: 1, wait: 0.3 },
  },
  crisisElite: {
    hp: 3, brain: 'attacker', aim: 0.95, score: 1800, color: '#6d1c2c', scale: 1.08,
    red: true, armor: 0.3,
    flinch: { rate: 0.3, str: 1, wait: 0.4 },
  },

  /* ---- the drugged tier ---- */
  neoSoldier: {
    hp: 4, brain: 'trance', aim: 1.0, score: 1300, color: '#7a5a86', scale: 1.06,
    flinch: { rate: 0.2, str: 1, wait: 0.5 },
  },
  neoSoldierRed: {
    hp: 5, brain: 'trance', aim: 0.9, score: 1600, color: '#8a4a6a', scale: 1.08, armor: 0.2,
    flinch: { rate: 0.15, str: 1, wait: 0.5 },
  },
  neoShield: {
    hp: 5, brain: 'shield', aim: 1.2, score: 2000, color: '#6a4a7a', scale: 1.12,
    shield: { hp: 12, dir: 'front' },
    flinch: null,
  },
  trance: {
    // "Aim for the head!" — body shots are near-useless on these.
    hp: 6, brain: 'trance', aim: 0.9, score: 1500, color: '#5d4b6b', scale: 1.05,
    headOnly: true, flinch: null,
  },
  tranceRunner: {
    hp: 4, brain: 'trance', aim: 0.7, score: 1700, color: '#6b4b5d', scale: 1.02,
    headOnly: true, flinch: null, rush: true,
  },

  /* ---- drones ---- */
  seeker: {
    hp: 1, brain: 'bit', aim: 1.1, score: 400, color: '#4a7f8a', scale: 0.7, flying: true,
    flinch: null,
  },
  squadSeeker: {
    hp: 2, brain: 'bit', aim: 0.85, score: 700, color: '#3f6f8a', scale: 0.75, flying: true,
    flinch: null,
  },
  giantBit: {
    hp: 3, brain: 'bit', aim: 0.7, score: 900, color: '#7a6a9a', scale: 0.8, flying: true,
    flinch: null,
  },

  /* ---- riders and vehicles ---- */
  riderBlue: {
    hp: 2, brain: 'attacker', aim: 1.3, score: 800, color: '#4a6a8a', scale: 1.1, rush: true,
    flinch: { rate: 0.4, str: 1, wait: 0.3 },
  },
  riderRed: {
    hp: 3, brain: 'attacker', aim: 1.1, score: 1100, color: '#8a4a4a', scale: 1.1, rush: true,
    flinch: { rate: 0.3, str: 1, wait: 0.3 },
  },
  riderBlack: {
    hp: 4, brain: 'elite', aim: 0.95, score: 1500, color: '#3a3f48', scale: 1.12,
    rush: true, armor: 0.3,
    flinch: { rate: 0.25, str: 1, wait: 0.35 },
  },
  enemyVehicle: {
    hp: 10, brain: 'heavyGun', aim: 1.4, score: 2500, color: '#5a5f52', scale: 1.7,
    static: true, armor: 0.5, flinch: null,
  },
  enemyTank: {
    hp: 20, brain: 'heavyGun', aim: 1.8, score: 4000, color: '#4a5242', scale: 2.1,
    static: true, armor: 0.7, flinch: null,
  },
  enemyHeli: {
    hp: 12, brain: 'heavyGun', aim: 1.5, score: 3000, color: '#454f5a', scale: 1.8,
    flying: true, armor: 0.4, flinch: null,
  },
  enemyUAH: {
    hp: 16, brain: 'heavyGun', aim: 1.2, score: 3500, color: '#3f4a5f', scale: 1.9,
    flying: true, armor: 0.5, flinch: null,
  },

  /* ---- destructibles and props ---- */
  explodable: {
    hp: 1, brain: 'none', aim: 0, score: 200, color: '#9a6a3a', scale: 0.9,
    static: true, passive: true, splash: 150, flinch: null,
  },
  targetMarker: {
    hp: 1, brain: 'none', aim: 0, score: 500, color: '#c0a020', scale: 0.6,
    static: true, passive: true, marker: true, flinch: null,
  },
  enemyFlock: {
    hp: 1, brain: 'bit', aim: 2.4, score: 150, color: '#6a6a6a', scale: 0.5,
    flying: true, passive: true, flinch: null,
  },
};

/** Enemies worth marking as ammo carriers ("Shoot this enemy!"). */
export const CARRIER_TINT = '#ffb020';

export function selfTest(ok) {
  const names = Object.keys(ENEMIES);
  ok('roster is the recovered ~30 archetypes', names.length >= 28);
  ok('every archetype declares hp, brain and score',
    names.every((n) => {
      const e = ENEMIES[n];
      return e.hp > 0 && typeof e.brain === 'string' && e.score > 0;
    }));
  ok('armor never fully absorbs body damage',
    names.every((n) => (ENEMIES[n].armor || 0) < 1));

  // The colour ladder must actually escalate, or the tiers are decoration.
  ok('infantry ladder escalates blue < red < yellow < black',
    ENEMIES.soldierBlue.score < ENEMIES.soldierRed.score &&
    ENEMIES.soldierRed.score < ENEMIES.soldierYellow.score &&
    ENEMIES.soldierYellow.score < ENEMIES.soldierBlack.score);
  ok('later tiers telegraph for less time',
    ENEMIES.soldierBlack.aim < ENEMIES.soldierBlue.aim);

  ok('crisis shooters are the ones flagged red',
    ENEMIES.crisisShooter.red === true && !ENEMIES.soldierBlue.red);
  ok('shield carriers declare shield hp', ENEMIES.shieldSoldier.shield.hp > 0);
  ok('the drugged tier resists flinching', ENEMIES.trance.flinch === null);
  ok('trance enemies are headshot checks', ENEMIES.trance.headOnly === true);
  ok('emplacements are static', ENEMIES.heavyGun.static === true);
  ok('drones fly', ENEMIES.seeker.flying === true);
  ok('passive props do not aim', ENEMIES.explodable.passive === true && ENEMIES.explodable.aim === 0);
}
