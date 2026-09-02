// @ts-check
/**
 * Optional local asset pack.
 *
 * The game draws everything procedurally and ships that way — the repo and the
 * deployed site contain no art or audio from anywhere else. But if a pack is
 * present on the machine running it, every sprite and sound below is taken from
 * that pack instead, and the procedural version becomes the fallback.
 *
 * Drop a pack at:   public/time-crisis/assets/
 * That folder is gitignored, so a local pack never enters version control and
 * never reaches the deployment. It is yours, it stays on your disk.
 *
 * A pack is a manifest plus files:
 *
 *   assets/manifest.json
 *   {
 *     "name": "my pack",
 *     "sprites": { "soldierBlue": "enemies/blue.png", "hud.frame": "ui/hud.png" },
 *     "sounds":  { "shot.handgun": "sfx/handgun.wav" }
 *   }
 *
 * Keys are the archetype ids from content/enemies.js, the weapon `short` codes
 * from content/weapons.js, and the `hud.*` / `fx.*` names used by render/.
 * Anything absent from the manifest simply falls back — a partial pack is fine
 * and is the normal case while one is being built up.
 */

/** Keys the renderer will look for. A pack may supply any subset. */
export const SPRITE_KEYS = [
  'hud.frame', 'hud.crosshair', 'hud.pedalL', 'hud.pedalR', 'hud.life', 'hud.ammo',
  'fx.muzzle', 'fx.impact', 'fx.blood', 'fx.explosion', 'fx.bulletHole',
  'cover.left', 'cover.right',
];

export const SOUND_KEYS = [
  'shot.handgun', 'shot.machinegun', 'shot.shotgun', 'shot.grenade',
  'reload', 'hit.body', 'hit.head', 'hit.armor', 'shield.break',
  'player.damage', 'countdown', 'countdown.last10', 'area.clear', 'weapon.change',
];

/**
 * Resolve one key against a pack.
 * Pure: no DOM, no network — this is the part worth testing.
 * Returns the URL to load, or null when the renderer should draw it itself.
 */
export function resolve(pack, kind, key) {
  if (!pack || !pack.manifest) return null;
  const table = pack.manifest[kind];
  if (!table) return null;
  const rel = table[key];
  if (!rel || typeof rel !== 'string') return null;
  // Keep a pack from reaching outside its own folder.
  if (rel.includes('..') || rel.startsWith('/') || /^[a-z]+:/i.test(rel)) return null;
  return pack.base.replace(/\/$/, '') + '/' + rel.replace(/^\//, '');
}

/** Which declared keys a pack actually covers — shown on the debug overlay. */
export function coverage(pack) {
  const has = (kind, keys) => keys.filter((k) => resolve(pack, kind, k) !== null).length;
  return {
    sprites: has('sprites', SPRITE_KEYS),
    spriteTotal: SPRITE_KEYS.length,
    sounds: has('sounds', SOUND_KEYS),
    soundTotal: SOUND_KEYS.length,
    name: (pack && pack.manifest && pack.manifest.name) || null,
  };
}

/**
 * Load the manifest. Absent pack is the normal case, not an error — a 404 here
 * just means "draw everything yourself", which is how the deployed site runs.
 * `fetchFn` is injectable so this is testable without a browser.
 */
export async function loadPack(base = './assets', fetchFn = globalThis.fetch) {
  if (typeof fetchFn !== 'function') return null;
  try {
    const res = await fetchFn(base.replace(/\/$/, '') + '/manifest.json');
    if (!res || !res.ok) return null;
    const manifest = await res.json();
    if (!manifest || typeof manifest !== 'object') return null;
    return { base, manifest };
  } catch {
    return null;
  }
}

/**
 * Decode every sprite the pack declares into Images.
 * Individual failures are swallowed: one bad file must not take the game down,
 * it just falls back to procedural for that one key.
 */
export async function loadSprites(pack, makeImage = defaultImage) {
  const out = new Map();
  if (!pack) return out;
  await Promise.all(SPRITE_KEYS.concat(Object.keys(pack.manifest.sprites || {})).map(async (key) => {
    if (out.has(key)) return;
    const url = resolve(pack, 'sprites', key);
    if (!url) return;
    try {
      out.set(key, await makeImage(url));
    } catch { /* fall back for this key only */ }
  }));
  return out;
}

function defaultImage(url) {
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = no;
    img.src = url;
  });
}

export function selfTest(ok) {
  const pack = {
    base: './assets',
    manifest: {
      name: 'test pack',
      sprites: { 'hud.frame': 'ui/frame.png', soldierBlue: 'enemies/blue.png' },
      sounds: { reload: 'sfx/reload.wav' },
    },
  };

  ok('a declared sprite resolves to a url inside the pack',
    resolve(pack, 'sprites', 'hud.frame') === './assets/ui/frame.png');
  ok('a declared sound resolves', resolve(pack, 'sounds', 'reload') === './assets/sfx/reload.wav');
  ok('an undeclared key falls back', resolve(pack, 'sprites', 'fx.muzzle') === null);
  ok('an unknown kind falls back', resolve(pack, 'music', 'anything') === null);
  ok('no pack means everything falls back', resolve(null, 'sprites', 'hud.frame') === null);

  // A pack must not be able to point outside its own folder.
  const escaping = { base: './assets', manifest: { sprites: {
    a: '../../../secret.png', b: '/etc/passwd', c: 'https://elsewhere.example/x.png',
  } } };
  ok('a pack cannot traverse upwards', resolve(escaping, 'sprites', 'a') === null);
  ok('a pack cannot use an absolute path', resolve(escaping, 'sprites', 'b') === null);
  ok('a pack cannot pull from another origin', resolve(escaping, 'sprites', 'c') === null);

  // Extra keys a pack invents are allowed through, so the renderer can grow.
  ok('a pack may declare keys beyond the known list',
    resolve(pack, 'sprites', 'soldierBlue') === './assets/enemies/blue.png');

  const cov = coverage(pack);
  ok('coverage counts only the known keys it supplies', cov.sprites === 1);
  ok('coverage reports the pack name', cov.name === 'test pack');
  ok('coverage of no pack is zero', coverage(null).sprites === 0);

  // Loading must treat an absent pack as normal, never as a failure.
  const missing = { ok: false, status: 404 };
  loadPack('./assets', async () => missing).then((p) => {
    ok('a missing manifest yields no pack, not an error', p === null);
  });
  loadPack('./assets', async () => { throw new Error('offline'); }).then((p) => {
    ok('a network failure yields no pack, not an error', p === null);
  });
  loadPack('./assets', async () => ({ ok: true, json: async () => ({ name: 'p', sprites: {} }) }))
    .then((p) => ok('a present manifest yields a pack', !!p && p.manifest.name === 'p'));
  ok('loadPack without a fetch implementation is safe',
    loadPack('./assets', undefined) instanceof Promise);
}
