// @ts-check
/**
 * Player weapons.
 *
 * The eight names are the localisation file's own weapon labels, and the
 * magazine sizes for machinegun / shotgun / grenade come straight from
 * DropAmmoNums[] in DefaultGame.ini (20 / 5 / 1) — in this series a "pickup" is
 * one magazine, which is why the debug console granted them in whole units.
 *
 * The handgun is the only weapon with unlimited ammunition; it reloads by
 * ducking into cover. Everything else is topped up by shooting the marked
 * carriers, and reverts to the handgun when dry.
 */

import { TC } from '../core/tune.js';

export const WEAPONS = [
  {
    id: 0, name: 'HANDGUN', short: 'HG',
    dmg: 1, rof: 0.11, pellets: 1, spread: 0, auto: false,
    mag: TC.MAG, infinite: true,
  },
  {
    id: 1, name: 'MACHINE GUN', short: 'MG',
    dmg: 1, rof: 0.07, pellets: 1, spread: 14, auto: true,
    mag: TC.DROP_AMMO[1],
  },
  {
    id: 2, name: 'SHOTGUN', short: 'SG',
    dmg: 3, rof: 0.5, pellets: 5, spread: 62, auto: false,
    mag: TC.DROP_AMMO[2],
  },
  {
    id: 3, name: 'GRENADE', short: 'GL',
    dmg: 25, rof: 0.8, pellets: 1, spread: 0, auto: false,
    mag: TC.DROP_AMMO[3], splash: 190,
  },
  {
    // "Aim each shot and shoot!" — only usable inside a snipe event, where it
    // one-shots whatever it hits and pays the ONE SHOT KILL bonus.
    id: 4, name: 'SNIPER RIFLE', short: 'SPR',
    dmg: 100, rof: 1.1, pellets: 1, spread: 0, auto: false,
    mag: 6, zoom: 2.4, eventOnly: true, oneShotKill: true,
  },
  {
    // Bolted to a truck or a chopper; the rail sections hand it to you.
    id: 5, name: 'MOUNTED MACHINE GUN', short: 'HMG',
    dmg: 2, rof: 0.055, pellets: 1, spread: 22, auto: true,
    mag: 200, mounted: true, eventOnly: true,
  },
  {
    id: 6, name: 'MISSILE', short: 'MSL',
    dmg: 40, rof: 1.0, pellets: 1, spread: 0, auto: false,
    mag: 8, splash: 240, homing: true, eventOnly: true,
  },
  {
    id: 7, name: 'ROCKET LAUNCHER', short: 'RL',
    dmg: 60, rof: 1.4, pellets: 1, spread: 0, auto: false,
    mag: 3, splash: 300,
  },
];

export const byName = (name) => WEAPONS.find((w) => w.name === name);
export const byShort = (s) => WEAPONS.find((w) => w.short === s);

/** Weapons a marked carrier can drop. Never the handgun, never event-only. */
export const DROPPABLE = WEAPONS.filter((w) => !w.infinite && !w.eventOnly).map((w) => w.id);

export function selfTest(ok) {
  ok('all eight recovered weapons are present', WEAPONS.length === 8);
  ok('weapon ids match their array index', WEAPONS.every((w, i) => w.id === i));
  ok('handgun is the only unlimited weapon',
    WEAPONS.filter((w) => w.infinite).length === 1 && WEAPONS[0].infinite);
  ok('handgun magazine is 9', WEAPONS[0].mag === 9);

  // The drop sizes are ported facts, not preferences.
  ok('machinegun magazine matches DropAmmoNums[1]', WEAPONS[1].mag === TC.DROP_AMMO[1]);
  ok('shotgun magazine matches DropAmmoNums[2]', WEAPONS[2].mag === TC.DROP_AMMO[2]);
  ok('grenade magazine matches DropAmmoNums[3]', WEAPONS[3].mag === TC.DROP_AMMO[3]);

  ok('shotgun fires a spread of pellets', WEAPONS[2].pellets > 1 && WEAPONS[2].spread > 0);
  ok('machinegun is the automatic one', WEAPONS[1].auto === true && !WEAPONS[0].auto);
  ok('explosive weapons declare a splash radius',
    WEAPONS[3].splash > 0 && WEAPONS[6].splash > 0 && WEAPONS[7].splash > 0);
  ok('sniper pays the one-shot-kill bonus', WEAPONS[4].oneShotKill === true);

  ok('carriers never drop the handgun', !DROPPABLE.includes(0));
  ok('carriers never drop event-only weapons',
    DROPPABLE.every((id) => !WEAPONS[id].eventOnly));
  ok('the three classic pickups are droppable',
    [1, 2, 3].every((id) => DROPPABLE.includes(id)));

  ok('every weapon has a positive rate of fire', WEAPONS.every((w) => w.rof > 0));
  ok('every weapon has a distinct name',
    new Set(WEAPONS.map((w) => w.name)).size === WEAPONS.length);
}
