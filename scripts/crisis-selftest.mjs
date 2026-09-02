/**
 * Runs every sim/content module's selfTest() outside a browser.
 *
 * The modules under public/time-crisis/{core,sim,content} are deliberately free
 * of DOM, window and AudioContext references, which is what lets Node import
 * them directly. Anything that reaches for a global belongs in main.js or
 * render/, not here — if this script starts failing with "document is not
 * defined", that separation has been broken and that is the bug to fix.
 */

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = join(process.cwd(), 'public/time-crisis');
// '.' picks up modules at the package root, such as audio.js — leaving it
// out meant a whole module's asserts silently never ran.
const DIRS = ['.', 'core', 'sim', 'content', 'render'];

let pass = 0;
const fails = [];
const noTest = [];

for (const dir of DIRS) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  for (const file of readdirSync(abs).filter((f) => f.endsWith('.js') && f !== 'main.js').sort()) {
    const rel = dir === '.' ? file : `${dir}/${file}`;
    let mod;
    try {
      mod = await import(pathToFileURL(join(abs, file)).href);
    } catch (err) {
      fails.push(`${rel} — failed to import: ${err.message}`);
      continue;
    }
    if (typeof mod.selfTest !== 'function') { noTest.push(rel); continue; }
    try {
      mod.selfTest((name, cond) => {
        if (cond) pass++;
        else fails.push(`${rel}: ${name}`);
      });
    } catch (err) {
      fails.push(`${rel} — selfTest threw: ${err.message}`);
    }
  }
}

console.log(`crisis-selftest: ${pass} passed, ${fails.length} failed`);
if (noTest.length) console.log(`  no selfTest: ${noTest.join(', ')}`);
for (const f of fails) console.log('  FAIL  ' + f);
if (fails.length) process.exit(1);
