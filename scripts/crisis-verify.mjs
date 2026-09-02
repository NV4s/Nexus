/**
 * 1:1 constant verifier.
 *
 * Parses the arcade build's own config files and asserts that every gameplay
 * constant we claim to have ported appears in core/tune.js with the identical
 * value. This is the measurable half of the port: it is not a matter of taste
 * or of how the game feels, it either matches the shipped data or it does not.
 *
 *   node scripts/crisis-verify.mjs [path-to-dump]
 *
 * The dump is not in the repo, so this skips cleanly when it is absent —
 * CI stays green, and it fails loudly when the files ARE present and disagree.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CANDIDATES = [
  process.argv[2],
  'C:/Users/Alexander/Downloads/Time Crisis 5/Time Crisis 5',
  'C:/Users/Alexander/Downloads/[kim_sama_999]Time Crisis 5/Time Crisis 5',
].filter(Boolean);

const root = CANDIDATES.find((p) => existsSync(join(p, 'TC5/TimeCrisisGame/Config/DefaultGame.ini')));

if (!root) {
  console.log('crisis-verify: arcade build not found, skipping constant check.');
  console.log('  pass the dump path as argv[2] to run it.');
  process.exit(0);
}

/**
 * UE3 ini reader. Sections repeat and merge, and the last assignment of a key
 * wins. `only` restricts the read to one section, which matters here: the
 * engine config carries both [SystemSettings] at 1280x720 (what the cabinet
 * runs) and [SystemSettingsEditor] at 1280x1024 (what the level editor opened
 * at). Reading the file flat silently hands you the editor's resolution.
 */
function readIni(file, only = null) {
  const text = readFileSync(file, 'latin1');
  const out = new Map();
  let section = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';')) continue;
    if (line.startsWith('[')) { section = line.slice(1, line.indexOf(']')); continue; }
    if (only && section !== only) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    const semi = val.indexOf(';');
    if (semi >= 0) val = val.slice(0, semi).trim();
    out.set(key, val);
  }
  return out;
}

const game = readIni(join(root, 'TC5/TimeCrisisGame/Config/DefaultGame.ini'));
const testmode = readFileSync(join(root, 'testmode.xml'), 'utf8');

/**
 * Pull a <menu> default out of the operator service menu.
 * Two shapes are in use: `selectrange` menus carry varDefault as an attribute,
 * while `selector` menus mark it on the chosen <selectoritem default="true">.
 */
function menuDefault(varName) {
  let from = 0;
  for (;;) {
    const at = testmode.indexOf(`outVarName="${varName}"`, from);
    if (at < 0) return null;
    from = at + 1;
    const start = testmode.lastIndexOf('<menu', at);
    if (start < 0) continue;

    // Decide the block end from the opening tag itself. Scanning for the first
    // '/>' finds the one closing the first <selectoritem>, which cuts the block
    // short of the item actually marked as the default.
    const tagEnd = testmode.indexOf('>', at);
    const selfClosing = testmode[tagEnd - 1] === '/';
    const end = selfClosing ? tagEnd : testmode.indexOf('</menu>', start);
    const block = testmode.slice(start, end < 0 ? tagEnd : end);

    const attr = block.match(/varDefault="([^"]*)"/);
    if (attr) return attr[1];

    for (const item of block.match(/<selectoritem[^>]*>/g) || []) {
      if (/default="true"/i.test(item)) {
        const v = item.match(/value="([^"]*)"/);
        if (v) return v[1];
      }
    }
  }
}

const tuneUrl = pathToFileURL(
  join(process.cwd(), 'public/time-crisis/core/tune.js'),
).href;
const { TC } = await import(tuneUrl);

let pass = 0;
const fails = [];
const check = (label, recovered, ours) => {
  const r = typeof recovered === 'string' ? recovered.trim() : recovered;
  const ok = Number(r) === Number(ours) || String(r).toUpperCase() === String(ours).toUpperCase();
  if (ok) pass++;
  else fails.push(`${label}\n      shipped build: ${r}\n      core/tune.js:  ${ours}`);
};

/* ---- DefaultGame.ini ---- */
check('InvincibleDuration', game.get('InvincibleDuration'), TC.INVINCIBLE_AFTER_HIT);
check('InvincibleDurationWhenEntry', game.get('InvincibleDurationWhenEntry'), TC.INVINCIBLE_ON_ENTRY);
check('KismetStayInCoverDuration', game.get('KismetStayInCoverDuration'), TC.STAY_IN_COVER);
check('PlayerPawnCoverTimeMultiplier', game.get('PlayerPawnCoverTimeMultiplier'), TC.COVER_MULT);
check('PlayerPawnUnCoverTimeMultiplier', game.get('PlayerPawnUnCoverTimeMultiplier'), TC.UNCOVER_MULT);
check('HeadShotDamageRate', game.get('HeadShotDamageRate'), TC.HEADSHOT_MULT);
check('RedBulletShotWaitTime', game.get('RedBulletShotWaitTime'), TC.RED_SHOT_WAIT);
check('RedBulletDamageWaitTime', game.get('RedBulletDamageWaitTime'), TC.RED_DAMAGE_WAIT);
check('MinRedBulletInterval', game.get('MinRedBulletInterval'), TC.RED_MIN_INTERVAL);
check('DropAmmoNums[0]', game.get('DropAmmoNums[0]'), TC.DROP_AMMO[0]);
check('DropAmmoNums[1]', game.get('DropAmmoNums[1]'), TC.DROP_AMMO[1]);
check('DropAmmoNums[2]', game.get('DropAmmoNums[2]'), TC.DROP_AMMO[2]);
check('DropAmmoNums[3]', game.get('DropAmmoNums[3]'), TC.DROP_AMMO[3]);
check('bReversePlayerCoverInput', game.get('bReversePlayerCoverInput'), String(TC.REVERSE_COVER_INPUT));
check('bDisplayScreenBulletHoles', game.get('bDisplayScreenBulletHoles'), String(TC.SHOW_BULLET_HOLES));
check('bDisplayGunCrosshairs', game.get('bDisplayGunCrosshairs'), String(TC.SHOW_CROSSHAIRS));

/* ---- DefaultEngine.ini: the locked frame rate the windows are expressed in ---- */
const engine = readIni(join(root, 'TC5/TimeCrisisGame/Config/DefaultEngine.ini'), 'SystemSettings');
check('ResX', engine.get('ResX'), TC.RES_X);
check('ResY', engine.get('ResY'), TC.RES_Y);
check('MaxSmoothedFrameRate (1/FRAME)', engine.get('MaxSmoothedFrameRate'), Math.round(1 / TC.FRAME));

/* ---- testmode.xml operator settings ---- */
check('PLAYER\'S LIFE default (varGameHealthMax)', menuDefault('varGameHealthMax'), TC.LIFE_DEFAULT);
check('DIFFICULTY default (varGameDifficulty)', menuDefault('varGameDifficulty'), TC.DIFFICULTY_DEFAULT);
check('HIT-COLOR default (varGameHitColor)', menuDefault('varGameHitColor'), TC.HIT_COLOR_DEFAULT);
check('GAME COST default (varGameCost)', menuDefault('varGameCost'), TC.GAME_COST);
check('CONTINUE COST default (varContinueCost)', menuDefault('varContinueCost'), TC.CONTINUE_COST);

/* ---- DefaultInput.ini: the pedal bindings the control scheme is built on ---- */
const input = readFileSync(join(root, 'TC5/TimeCrisisGame/Config/DefaultInput.ini'), 'latin1');
const bind = (key, cmd) =>
  new RegExp(`Name="${key}"\\s*,\\s*Command="${cmd}`, 'i').test(input);
if (bind('t', 'StartPedalL')) pass++;
else fails.push('DefaultInput.ini: "t" is not bound to StartPedalL');
if (bind('y', 'StartPedalR')) pass++;
else fails.push('DefaultInput.ini: "y" is not bound to StartPedalR');

console.log(`crisis-verify: ${pass} constants match the shipped build, ${fails.length} disagree`);
if (fails.length) {
  for (const f of fails) console.log('  MISMATCH  ' + f);
  process.exit(1);
}
console.log('  dump: ' + root);
