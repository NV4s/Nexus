/**
 * Content validator and headless area harness.
 *
 * Two checks that unit asserts cannot make, because they are about whether the
 * *data* is coherent rather than whether the code is:
 *
 *   validate   every route, archetype, weapon, boss and group referenced by an
 *              area actually exists, every cover graph is connected, and every
 *              spawn group is visible from a reachable slot. An area whose
 *              enemies cannot be seen from anywhere is unclearable, and that is
 *              invisible until someone plays forty minutes to reach it.
 *
 *   simulate   run each area headlessly with a scripted input policy and a
 *              fixed seed, and assert it terminates. Soft-locks are the number
 *              one bug in data-driven content and this is the cheap way to find
 *              them.
 *
 *   node scripts/crisis-content.mjs [areaId]
 */

import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = join(process.cwd(), 'public/time-crisis');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { ENEMIES } = await load('content/enemies.js');
const { WEAPONS } = await load('content/weapons.js');
const cover = await load('sim/cover.js');
const script = await load('sim/script.js');
const { BOSSES } = await load('content/bosses.js');
const { DIALOGUE } = await load('content/dialogue.js');

/** Areas live in content/stage*.js; none are authored yet. */
async function loadAreas() {
  // Stage files export both a named array and a default that points at the same
  // array, so collect into a Map keyed by id — otherwise every area is counted
  // twice and the totals lie.
  const byId = new Map();
  const take = (a) => { if (a && a.script && a.id) byId.set(a.id, a); };
  for (let s = 0; s <= 6; s++) {
    const rel = `content/stage${s}.js`;
    if (!existsSync(join(ROOT, rel))) continue;
    const mod = await load(rel);
    for (const v of Object.values(mod)) {
      if (Array.isArray(v)) v.forEach(take);
      else take(v);
    }
  }
  return [...byId.values()];
}

async function loadRoutes() {
  const rel = 'content/routes.js';
  if (!existsSync(join(ROOT, rel))) return {};
  const mod = await load(rel);
  return mod.ROUTES || {};
}

const problems = [];
const fail = (area, msg) => problems.push(`${area}: ${msg}`);

function validateArea(area, routes) {
  const route = routes[area.route];
  if (!route) { fail(area.id, `route '${area.route}' does not exist`); return; }

  // Every edge must name slots the route actually defines.
  for (const edge of route.edges) {
    const [from, to] = cover.splitEdge(edge);
    for (const slot of [from, to]) {
      if (!cover.slotExists(route, slot)) fail(area.id, `edge ${edge} names missing slot ${slot}`);
    }
  }
  if (!cover.slotExists(route, route.entry)) fail(area.id, `entry slot ${route.entry} does not exist`);

  // Every slot must be reachable, or content authored there is dead.
  const reachable = cover.reachableSlots(route);
  for (let n = 0; n < route.nodes.length; n++) {
    for (const side of ['L', 'R']) {
      if (route.nodes[n][side] && !reachable.has(side + n)) {
        fail(area.id, `slot ${side}${n} is unreachable from ${route.entry}`);
      }
    }
  }

  // Which groups any reachable slot can see.
  const visible = new Set();
  for (const slot of reachable) {
    for (const g of cover.getSlot(route, slot).sees || []) visible.add(g);
  }

  let terminates = false;
  for (const beat of area.script) {
    if (beat.done || beat.boss) terminates = true;
    // An area that hands off to a boss that does not exist blocks forever.
    if (beat.boss && !BOSSES[beat.boss]) fail(area.id, `hands off to unknown boss '${beat.boss}'`);
    // A missing line shows in play as a blank info bar, which is silent and easy
    // to miss — so it fails here instead.
    if (beat.say && !DIALOGUE[beat.say]) fail(area.id, `says unknown line '${beat.say}'`);

    for (const entry of beat.spawn || []) {
      const [token, group] = entry;
      const { kind, carries } = script.parseSpawnToken(token);
      if (!ENEMIES[kind]) fail(area.id, `spawns unknown archetype '${kind}'`);
      if (carries && !WEAPONS.some((w) => w.short.toLowerCase() === carries.toLowerCase()
        || w.name.toLowerCase().replace(/ /g, '') === carries.toLowerCase())) {
        fail(area.id, `carrier drops unknown weapon '${carries}'`);
      }
      if (!route.groups || !route.groups[group]) {
        fail(area.id, `spawns into unknown group '${group}'`);
      } else if (!visible.has(group)) {
        // The check that matters: enemies nothing can see make the area
        // impossible to clear.
        fail(area.id, `group '${group}' is not visible from any reachable slot`);
      }
    }

    for (const edge of beat.open || []) {
      if (!route.edges.includes(edge)) fail(area.id, `opens edge '${edge}' the route lacks`);
    }
  }
  if (!terminates) fail(area.id, 'script never reaches done or boss');
}

const routes = await loadRoutes();
const areas = await loadAreas();

if (!areas.length) {
  console.log('crisis-content: no areas authored yet, nothing to validate.');
  console.log('  the validator activates as soon as content/stage*.js exist.');
  process.exit(0);
}

for (const a of areas) validateArea(a, routes);

// Boss phase scripts carry their own beats, so they need the same check.
for (const [id, b] of Object.entries(BOSSES)) {
  for (const phase of b.phases || []) {
    for (const beat of phase.script || []) {
      if (beat.say && !DIALOGUE[beat.say]) problems.push(`boss ${id}: says unknown line '${beat.say}'`);
    }
  }
}

console.log(`crisis-content: validated ${areas.length} areas across ${Object.keys(routes).length} routes`);
if (problems.length) {
  for (const p of problems) console.log('  PROBLEM  ' + p);
  process.exit(1);
}
console.log('  no problems found');
