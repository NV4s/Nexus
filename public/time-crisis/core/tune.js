/**
 * Every number the game runs on, in one file.
 *
 * TC = constants recovered verbatim from the arcade build's own config
 *      (TC5/TimeCrisisGame/Config/DefaultGame.ini and DefaultInput.ini, plus the
 *      operator service menu in testmode.xml). These are ported facts. Do not
 *      "improve" them — where a value looks odd it is because the original was
 *      authored in 30fps frames, and the frame count is noted alongside.
 *
 * TUNING = everything the dump could NOT give us. The damage, score and
 *      difficulty tables live inside LZO-compressed UnrealScript packages and
 *      are unrecoverable, so these are invented and tuned by feel. They are
 *      quarantined here rather than scattered through the modules so the whole
 *      game can be retuned from one screen.
 */

/* ------------------------------------------------------------------ *
 * RECOVERED — do not edit
 * ------------------------------------------------------------------ */
export const TC = {
  // The build is locked to 30fps at 1280x720 (DefaultEngine.ini: bLockToVsync,
  // MaxSmoothedFrameRate=30). Frame-count comments below are at 30fps.
  FRAME: 1 / 30,
  RES_X: 1280,
  RES_Y: 720,

  // TCPlayerPawn
  INVINCIBLE_AFTER_HIT: 2.0,   // InvincibleDuration
  INVINCIBLE_ON_ENTRY: 3.0,    // InvincibleDurationWhenEntry
  STAY_IN_COVER: 5,            // KismetStayInCoverDuration
  COVER_MULT: 2.0,             // PlayerPawnCoverTimeMultiplier
  UNCOVER_MULT: 1.0,           // PlayerPawnUnCoverTimeMultiplier

  // RailsShooterPawn
  HEADSHOT_MULT: 20.0,         // HeadShotDamageRate

  // TCWeap_EGun — the "crisis shot" telegraph windows
  RED_SHOT_WAIT: 0.05,         // RedBulletShotWaitTime      (~2 frames)
  RED_DAMAGE_WAIT: 0.4,        // RedBulletDamageWaitTime    (~23 frames)
  RED_MIN_INTERVAL: 0.0833,    // MinRedBulletInterval       (5 frames)

  // TCPawn_Enemy.DropAmmoNums[] — [dummy, machinegun, shotgun, grenade]
  DROP_AMMO: [0, 20, 5, 1],

  // TimeCrisisPlayerController: pedal held = exposed, released = hide AND reload
  REVERSE_COVER_INPUT: true,

  // RailsShooterPlayerWeaponGun
  SHOW_BULLET_HOLES: true,     // bDisplayScreenBulletHoles
  SHOW_CROSSHAIRS: true,       // bDisplayGunCrosshairs

  // Operator service menu (testmode.xml)
  LIFE_MIN: 1, LIFE_MAX: 9, LIFE_DEFAULT: 3,   // PLAYER'S LIFE
  DIFFICULTY_DEFAULT: 2,                        // C (NORMAL) of A..E
  GAME_COST: 2,                                 // credits to start
  CONTINUE_COST: 1,
  HIT_COLOR_DEFAULT: 0,                         // 0 = RED, 1 = GREEN

  // Handgun magazine. Not in the ini — the series constant, and the HUD is
  // authored for it.
  MAG: 9,
};

/** Cover transitions, derived from the recovered multipliers. */
export const COVER_BASE = 0.2;
export const T_COVER = COVER_BASE / TC.COVER_MULT;     // 0.10s — ducking is quick
export const T_UNCOVER = COVER_BASE / TC.UNCOVER_MULT; // 0.20s — leaning out is not

/** DIFFICULTY A..E from the service menu. Curve invented; slot count is not. */
export const DIFFICULTY = [
  { id: 'A', name: 'VERY EASY', aim: 1.55, dmg: 0.5, red: 0.35, waveScale: 0.75 },
  { id: 'B', name: 'EASY',      aim: 1.25, dmg: 0.75, red: 0.6,  waveScale: 0.9 },
  { id: 'C', name: 'NORMAL',    aim: 1.0,  dmg: 1.0,  red: 1.0,  waveScale: 1.0 },
  { id: 'D', name: 'HARD',      aim: 0.82, dmg: 1.0,  red: 1.35, waveScale: 1.15 },
  { id: 'E', name: 'VERY HARD', aim: 0.68, dmg: 1.0,  red: 1.7,  waveScale: 1.3 },
];

/* ------------------------------------------------------------------ *
 * INVENTED — tune freely
 * ------------------------------------------------------------------ */
export const TUNING = {
  // Cover traversal. The arcade ran an animation here; we run a timer.
  MOVE_DUR: 0.55,
  // How far into the lean you must be before the gun will fire.
  FIRE_EXPOSURE: 0.55,
  // How far into cover counts as safe from an incoming shot.
  SAFE_EXPOSURE: 0.5,

  // Enemy fire
  BULLET_TRAVEL_NEAR: 0.45,
  BULLET_TRAVEL_FAR: 0.75,
  ENEMY_COOLDOWN: [1.4, 3.0],
  ENEMY_COOLDOWN_BOSS: [0.5, 1.1],
  // Enemies you cannot currently see still think, but slowly — they should be
  // waiting for you when you swing back, not have cleared their whole cycle.
  UNSEEN_THINK_RATE: 0.25,

  // Scoring
  COMBO_WINDOW: 2.6,
  COMBO_STEP: 0.1,
  COMBO_CAP: 20,
  HEADSHOT_SCORE_MULT: 2,
  BULLSEYE_RADIUS: 0.28,     // fraction of the head box counting as dead centre
  BULLSEYE_SCORE: 500,
  SIDE_ATTACK_SCORE: [1000, 1500, 2500, 4000],  // SideAttackComboScoreTable
  ONE_SHOT_KILL_SCORE: 1000,
  SHURIKEN_SCORE: 300,
  TIME_BONUS_PER_SEC: 100,
  ACCURACY_BONUS: 5000,      // paid at 100% on a stage result

  // Area flow
  WAVE_TIME_BONUS: 14,
  TIMEOUT_REGRANT: 12,       // seconds handed back after a timeout death
  CALLOUTS: [30, 10, 5],     // "30 seconds left!" etc.

  // Pickups
  DROP_CHANCE: 0.22,
  PICKUP_LIFE: 9,
  PICKUP_RADIUS: 42,

  // Feel
  SHAKE_HIT: 18,
  SHAKE_SPLASH: 10,
  FLASH_MUZZLE: 0.06,
  HIT_FLASH: 0.5,
};

/** Current operator settings. Mutable; the settings screen writes here. */
export const settings = {
  life: TC.LIFE_DEFAULT,
  difficulty: TC.DIFFICULTY_DEFAULT,
  hitColor: TC.HIT_COLOR_DEFAULT,
  gameCost: TC.GAME_COST,
  continueCost: TC.CONTINUE_COST,
  freePlay: true,   // this is a website, not a cabinet with a coin slot
};

export const diff = () => DIFFICULTY[settings.difficulty];

export function selfTest(ok) {
  ok('headshot multiplier matches HeadShotDamageRate', TC.HEADSHOT_MULT === 20);
  ok('red bullet window matches RedBulletDamageWaitTime', TC.RED_DAMAGE_WAIT === 0.4);
  ok('red telegraph matches RedBulletShotWaitTime', TC.RED_SHOT_WAIT === 0.05);
  ok('red interval matches MinRedBulletInterval', TC.RED_MIN_INTERVAL === 0.0833);
  ok('drop ammo table matches DropAmmoNums', TC.DROP_AMMO.join() === '0,20,5,1');
  ok('handgun magazine is 9', TC.MAG === 9);
  ok('ducking into cover is faster than leaning out', T_COVER < T_UNCOVER);
  ok('cover multiplier 2.0 halves the base duration', Math.abs(T_COVER - 0.1) < 1e-9);
  ok('five difficulty slots, A through E', DIFFICULTY.length === 5 && DIFFICULTY[4].id === 'E');
  ok('default difficulty is C (NORMAL)', DIFFICULTY[TC.DIFFICULTY_DEFAULT].name === 'NORMAL');
  ok('player life range is 1..9 default 3', TC.LIFE_MIN === 1 && TC.LIFE_MAX === 9 && TC.LIFE_DEFAULT === 3);
  // Difficulty must be monotonic or the A..E selector is meaningless.
  ok('difficulty aim time decreases monotonically', DIFFICULTY.every((d, i) => i === 0 || d.aim < DIFFICULTY[i - 1].aim));
}
