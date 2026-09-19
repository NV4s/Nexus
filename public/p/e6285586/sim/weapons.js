// @ts-check
/**
 * Firing runtime: magazines, the trigger, carrier drops, and the slot row.
 *
 * Two rules come straight from the shipped build rather than from taste:
 *
 *   the handgun never runs out, and ducking fully into cover reloads it — there
 *   is no reload button anywhere in the control scheme;
 *
 *   every other weapon is topped up only by shooting a marked carrier, and its
 *   magazine size is DropAmmoNums (20 machinegun, 5 shotgun, 1 grenade). When
 *   one runs dry the player reverts to the handgun.
 *
 * The recording added a third: the bottom-left is a ROW of weapon slots, not a
 * single weapon, and the active one is highlighted.
 */

import { TUNING } from '../core/tune.js';
import { WEAPONS, DROPPABLE } from '../content/weapons.js';

/** Slots the player carries. Index 0 is always the handgun. */
export const SLOT_COUNT = 5;

export function createArsenal() {
  return {
    slots: [
      { id: 0, ammo: WEAPONS[0].mag },   // handgun, always present
      null, null, null, null,
    ],
    active: 0,
    cooldown: 0,
    /** rounds fired since the last reload, for the HUD's mag count */
    fired: 0,
  };
}

export const activeWeapon = (a) => WEAPONS[a.slots[a.active].id];
export const activeAmmo = (a) => a.slots[a.active].ammo;
export const isInfinite = (a) => !!activeWeapon(a).infinite;

/** Ducking fully into cover reloads. The handgun only — specials do not refill. */
export function reload(arsenal) {
  const slot = arsenal.slots[0];
  const before = slot.ammo;
  slot.ammo = WEAPONS[0].mag;
  arsenal.fired = 0;
  return slot.ammo !== before;
}

/**
 * Can the trigger produce a shot right now?
 * Firing needs the player leaned out — the gun does not clear cover otherwise.
 */
export function canFire(arsenal, exposure) {
  if (arsenal.cooldown > 0) return false;
  if (exposure < TUNING.FIRE_EXPOSURE) return false;
  return true;
}

/**
 * Pull the trigger.
 * Returns { pellets, weapon } describing the shot, or a reason it did not fire.
 */
export function fire(arsenal, exposure) {
  if (arsenal.cooldown > 0) return { fired: false, reason: 'cooldown' };
  if (exposure < TUNING.FIRE_EXPOSURE) return { fired: false, reason: 'covered' };

  const slot = arsenal.slots[arsenal.active];
  const w = WEAPONS[slot.id];

  if (slot.ammo <= 0) {
    // Dry. The handgun is never dry for long — cover reloads it — but a special
    // that empties hands the player back to the sidearm.
    arsenal.cooldown = 0.18;
    if (!w.infinite) revertToHandgun(arsenal);
    return { fired: false, reason: 'empty' };
  }

  slot.ammo--;
  arsenal.fired++;
  arsenal.cooldown = w.rof;

  const pellets = [];
  for (let i = 0; i < w.pellets; i++) {
    pellets.push({
      spreadX: w.pellets === 1 ? 0 : (Math.random() * 2 - 1) * w.spread,
      spreadY: w.pellets === 1 ? 0 : (Math.random() * 2 - 1) * w.spread,
    });
  }

  // Emptying a special immediately returns the handgun, so the player is never
  // left holding a weapon that cannot shoot.
  if (slot.ammo <= 0 && !w.infinite) revertToHandgun(arsenal);

  return { fired: true, weapon: w, pellets, dmg: w.dmg, splash: w.splash || 0 };
}

export function revertToHandgun(arsenal) {
  const i = arsenal.slots.findIndex((s) => s && s.id === 0);
  arsenal.active = i >= 0 ? i : 0;
}

/**
 * Pick up a dropped weapon. Fills an empty slot, or refills the one already
 * holding that weapon, and makes it active either way.
 */
export function pickUp(arsenal, weaponId) {
  const w = WEAPONS[weaponId];
  if (!w) return false;

  const existing = arsenal.slots.findIndex((s) => s && s.id === weaponId);
  if (existing >= 0) {
    arsenal.slots[existing].ammo = w.mag;
    arsenal.active = existing;
    return true;
  }

  const empty = arsenal.slots.findIndex((s) => s === null);
  if (empty >= 0) {
    arsenal.slots[empty] = { id: weaponId, ammo: w.mag };
    arsenal.active = empty;
    return true;
  }

  // Full: replace the emptiest non-handgun slot rather than refusing the pickup.
  let worst = -1, least = Infinity;
  arsenal.slots.forEach((s, i) => {
    if (s && s.id !== 0 && s.ammo < least) { least = s.ammo; worst = i; }
  });
  if (worst < 0) return false;
  arsenal.slots[worst] = { id: weaponId, ammo: w.mag };
  arsenal.active = worst;
  return true;
}

/** Cycle to the next slot that holds something. The gun button does this. */
export function nextWeapon(arsenal) {
  for (let n = 1; n <= arsenal.slots.length; n++) {
    const i = (arsenal.active + n) % arsenal.slots.length;
    if (arsenal.slots[i]) { arsenal.active = i; return i; }
  }
  return arsenal.active;
}

export function updateArsenal(arsenal, dt) {
  arsenal.cooldown = Math.max(0, arsenal.cooldown - dt);
}

/** What the HUD's slot row should draw. */
export function slotView(arsenal) {
  return arsenal.slots.map((s) => (s
    ? { id: s.id, short: WEAPONS[s.id].short, ammo: s.ammo, color: WEAPONS[s.id].splash ? '#c04ad0' : '#2f7fd0' }
    : null));
}

/** Weapon a carrier drops, resolved from the token after the '@'. */
export function resolveDrop(token) {
  const t = String(token).toLowerCase().replace(/[^a-z]/g, '');
  const w = WEAPONS.find((k) => k.short.toLowerCase() === t
    || k.name.toLowerCase().replace(/[^a-z]/g, '') === t);
  return w && DROPPABLE.includes(w.id) ? w.id : null;
}

export function selfTest(ok) {
  const a = createArsenal();
  ok('the arsenal starts with the handgun only',
    a.slots[0].id === 0 && a.slots.slice(1).every((s) => s === null));
  ok('the handgun starts loaded', activeAmmo(a) === 9);
  ok('the handgun is the unlimited weapon', isInfinite(a) === true);

  // Firing requires being leaned out.
  ok('the gun will not fire from behind cover', fire(a, 0).reason === 'covered');
  ok('ammo is untouched by a blocked shot', activeAmmo(a) === 9);
  const shot = fire(a, 1);
  ok('leaning out lets the gun fire', shot.fired === true);
  ok('firing spends a round', activeAmmo(a) === 8);
  ok('firing starts the cooldown', a.cooldown > 0);
  ok('a second shot inside the cooldown is refused', fire(a, 1).reason === 'cooldown');
  updateArsenal(a, 1);
  ok('the cooldown expires', a.cooldown === 0);

  // Running the handgun dry, then reloading by taking cover.
  for (let i = 0; i < 20; i++) { updateArsenal(a, 1); fire(a, 1); }
  ok('the handgun can be emptied', activeAmmo(a) === 0);
  updateArsenal(a, 1);
  ok('an empty gun reports empty', fire(a, 1).reason === 'empty');
  ok('taking cover reloads', reload(a) === true && activeAmmo(a) === 9);
  ok('reloading a full gun changes nothing', reload(a) === false);

  // Pickups.
  const b = createArsenal();
  ok('a shotgun pickup takes an empty slot', pickUp(b, 2) === true);
  ok('the pickup becomes active', b.slots[b.active].id === 2);
  ok('it arrives with its DropAmmoNums magazine', activeAmmo(b) === 5);
  ok('picking the same weapon again refills rather than duplicating',
    pickUp(b, 2) === true && b.slots.filter((s) => s && s.id === 2).length === 1);
  ok('an unknown weapon is refused', pickUp(b, 99) === false);

  // Emptying a special hands back the handgun.
  const c = createArsenal();
  pickUp(c, 3);                      // grenade, magazine of 1
  ok('the grenade holds a single round', activeAmmo(c) === 1);
  updateArsenal(c, 1); fire(c, 1);
  ok('firing the last grenade reverts to the handgun',
    c.slots[c.active].id === 0);
  ok('and the handgun still has its own ammo', activeAmmo(c) > 0);

  // A full rack replaces the emptiest special, never the handgun.
  const d = createArsenal();
  pickUp(d, 1); pickUp(d, 2); pickUp(d, 3); pickUp(d, 7);
  ok('four pickups fill the rack', d.slots.every((s) => s !== null));
  d.slots[2].ammo = 0;
  const before = d.slots[0].id;
  pickUp(d, 1);
  ok('a full rack still accepts a pickup', d.slots.some((s) => s.id === 1));
  ok('the handgun slot is never replaced', d.slots[0].id === before);

  // Cycling skips empty slots.
  const e = createArsenal();
  pickUp(e, 2);
  e.active = 0;
  ok('cycling reaches the other weapon', nextWeapon(e) !== 0);
  const solo = createArsenal();
  ok('cycling with one weapon stays put', nextWeapon(solo) === 0);

  // Shotgun spread.
  const f = createArsenal();
  pickUp(f, 2);
  const blast = fire(f, 1);
  ok('the shotgun fires several pellets', blast.pellets.length === 5);
  ok('pellets are spread apart',
    new Set(blast.pellets.map((p) => p.spreadX)).size > 1);
  const g = createArsenal();
  ok('the handgun fires a single centred pellet', (() => {
    const s = fire(g, 1);
    return s.pellets.length === 1 && s.pellets[0].spreadX === 0;
  })());

  // Explosive weapons report their splash so combat can apply it.
  const h = createArsenal();
  pickUp(h, 3);
  ok('a grenade reports its splash radius', fire(h, 1).splash > 0);

  // Drop tokens.
  ok('a short code resolves', resolveDrop('SG') === 2);
  ok('a full name resolves', resolveDrop('machinegun') === 1);
  ok('a name with spaces resolves', resolveDrop('machine gun') === 1);
  ok('the handgun is never a drop', resolveDrop('handgun') === null);
  ok('an event-only weapon is never a drop', resolveDrop('sniperrifle') === null);
  ok('nonsense resolves to nothing', resolveDrop('banana') === null);

  // The HUD row.
  const view = slotView(d);
  ok('the slot view has one entry per slot', view.length === SLOT_COUNT);
  ok('filled slots carry a short code and ammo',
    view.filter(Boolean).every((s) => !!s.short && typeof s.ammo === 'number'));
  ok('explosive slots are tinted apart',
    slotView(h).find((s) => s && s.id === 3).color !== slotView(h)[0].color);
}
