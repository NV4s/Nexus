// @ts-check
/**
 * Hit resolution: where the gun, the cover graph and the score tables meet.
 *
 * Hitboxes are the same two-box model the single-file build used — a head box
 * above a body box, both scaled by projected depth — plus per-part boxes for
 * bosses. Zones resolve in the order head, part, body, and the nearest enemy
 * wins, so a front rank genuinely shields the rank behind it.
 *
 * "flank" is not a geometric zone; it is the state the Side Attack beat puts an
 * enemy into while you are attacking from a slot it was not set up to face.
 * That is what lets a flank bypass a riot shield.
 */

import { TUNING } from '../core/tune.js';
import { project } from './camera.js';

/** Screen boxes for an enemy at the current camera. */
export function enemyBoxes(e, cover) {
  const p = project(e.wx, depthOf(e), cover, e.height);
  const s = p.scale * (e.def.scale || 1);
  const bodyH = 150 * s;
  const bodyW = 62 * s;
  const headR = 19 * s;
  const bodyTop = p.groundY - bodyH;
  return {
    p, s, bodyTop, bodyH, bodyW, headR,
    head: { x: p.x - headR, y: bodyTop - headR * 2, w: headR * 2, h: headR * 2.05 },
    body: { x: p.x - bodyW / 2, y: bodyTop, w: bodyW, h: bodyH },
    shield: e.shield > 0
      ? { x: p.x - bodyW * 0.75, y: bodyTop + bodyH * 0.1, w: bodyW * 1.5, h: bodyH * 0.7 }
      : null,
  };
}

/** Route z converted to the projector's 0..1 depth. */
export function depthOf(e) {
  const rel = Math.max(0.5, e.z);
  return Math.max(0.05, Math.min(1, 1 - rel / 40));
}

export const pointIn = (px, py, r) =>
  !!r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

/** Boss part boxes. `box` is [cx, cy, w, h] in body-relative units. */
export function partBox(e, part, cover) {
  const b = enemyBoxes(e, cover);
  return {
    x: b.p.x + part.box[0] * b.bodyW - (part.box[2] * b.bodyW) / 2,
    y: b.bodyTop + (0.5 + part.box[1]) * b.bodyH - (part.box[3] * b.bodyH) / 2,
    w: part.box[2] * b.bodyW,
    h: part.box[3] * b.bodyH,
  };
}

/**
 * Which zone, if any, does the shot at (ax, ay) land on?
 * Returns null for a clean miss on this enemy.
 */
export function hitZone(e, ax, ay, cover, opts = {}) {
  if (e.dead) return null;
  const b = enemyBoxes(e, cover);

  // Boss parts sit in front of the generic body box.
  if (e.parts) {
    for (const part of e.parts) {
      if (part.destroyed || !part.exposed) continue;
      if (pointIn(ax, ay, partBox(e, part, cover))) {
        return { zone: part.weak ? 'head' : 'part', part, box: b };
      }
    }
  }

  // A raised shield covers the body, but never the head.
  if (b.shield && !opts.flank && pointIn(ax, ay, b.shield) && !pointIn(ax, ay, b.head)) {
    return { zone: 'body', box: b, shielded: true };
  }

  if (pointIn(ax, ay, b.head)) {
    // BULL'S EYE — dead centre of the head, not merely inside it.
    const cx = b.head.x + b.head.w / 2;
    const cy = b.head.y + b.head.h / 2;
    const d = Math.hypot(ax - cx, ay - cy) / (b.headR || 1);
    return { zone: 'head', bullseye: d <= TUNING.BULLSEYE_RADIUS, box: b };
  }

  if (pointIn(ax, ay, b.body)) {
    return { zone: opts.flank ? 'flank' : 'body', box: b };
  }
  return null;
}

/**
 * Find what a shot hits, nearest first.
 * Only enemies the player's slot can currently engage are candidates — this is
 * where the cover graph gates the gun.
 */
export function pickTarget(enemies, ax, ay, cover, visible, flankedGroups) {
  const live = enemies
    .filter((e) => !e.dead && visible.has(e.group))
    .sort((a, b) => depthOf(b) - depthOf(a));

  for (const e of live) {
    const flank = flankedGroups ? flankedGroups.has(e.group) : false;
    const hit = hitZone(e, ax, ay, cover, { flank });
    if (hit) return { enemy: e, hit, flank };
  }
  return null;
}

export function selfTest(ok) {
  const route = {
    nodes: [{ L: { cam: [0, 1.4, 0], lean: [0, 0, 0], sees: ['g0'] },
              R: { cam: [0, 1.4, 0], lean: [0, 0, 0], sees: ['g1'] } }],
    edges: ['L0R0', 'R0L0'], entry: 'L0',
  };
  const cover = { route, slot: 'L0', side: 'L', node: 0, exposure: 1, moving: null };

  const mk = (over = {}) => ({
    wx: 0, z: 20, height: 0, dead: false, shield: 0, group: 'g0',
    def: { scale: 1 }, ...over,
  });

  const e = mk();
  const b = enemyBoxes(e, cover);
  ok('the head box sits above the body box', b.head.y + b.head.h <= b.body.y + 1);
  ok('boxes have positive area', b.body.w > 0 && b.body.h > 0);

  const headCentre = [b.head.x + b.head.w / 2, b.head.y + b.head.h / 2];
  ok('a shot at the head resolves as a headshot',
    hitZone(e, headCentre[0], headCentre[1], cover).zone === 'head');
  ok('dead centre of the head is a bullseye',
    hitZone(e, headCentre[0], headCentre[1], cover).bullseye === true);
  ok('the head edge is a headshot but not a bullseye',
    hitZone(e, b.head.x + 1, headCentre[1], cover).bullseye === false);
  ok('a shot at the torso resolves as a body hit',
    hitZone(e, b.body.x + b.body.w / 2, b.body.y + b.body.h / 2, cover).zone === 'body');
  ok('a shot into empty space hits nothing',
    hitZone(e, 5, 5, cover) === null);
  ok('a dead enemy cannot be hit', hitZone(mk({ dead: true }), headCentre[0], headCentre[1], cover) === null);

  // Nearer things are bigger, which is the only depth cue the player has.
  ok('nearer enemies present bigger boxes',
    enemyBoxes(mk({ z: 6 }), cover).bodyW > enemyBoxes(mk({ z: 34 }), cover).bodyW);
  ok('depth is inverted from route distance', depthOf(mk({ z: 5 })) > depthOf(mk({ z: 35 })));

  // A shield must stop torso fire but never protect the head.
  const sh = mk({ shield: 5 });
  const sb = enemyBoxes(sh, cover);
  ok('a shielded torso shot is marked shielded',
    hitZone(sh, sb.body.x + sb.body.w / 2, sb.body.y + sb.body.h / 2, cover).shielded === true);
  ok('a shield never covers the head',
    hitZone(sh, sb.head.x + sb.head.w / 2, sb.head.y + sb.head.h / 2, cover).zone === 'head');
  ok('flanking reads through the shield',
    !hitZone(sh, sb.body.x + sb.body.w / 2, sb.body.y + sb.body.h / 2, cover, { flank: true }).shielded);
  ok('a flanked body hit reports the flank zone',
    hitZone(mk(), b.body.x + b.body.w / 2, b.body.y + b.body.h / 2, cover, { flank: true }).zone === 'flank');

  // The cover graph must gate what the gun can reach.
  const visibleL = new Set(['g0']);
  const enemies = [mk(), mk({ group: 'g1' })];
  ok('you can shoot an enemy your slot sees',
    !!pickTarget(enemies, headCentre[0], headCentre[1], cover, visibleL));
  ok('you cannot shoot one your slot cannot see',
    pickTarget([mk({ group: 'g1' })], headCentre[0], headCentre[1], cover, visibleL) === null);

  // The front rank has to block the back rank, or depth means nothing.
  const near = mk({ z: 8 }), far = mk({ z: 30 });
  const nb = enemyBoxes(near, cover);
  const picked = pickTarget([far, near], nb.body.x + nb.body.w / 2, nb.body.y + nb.body.h / 2, cover, visibleL);
  ok('the nearest enemy is hit first', picked && picked.enemy === near);

  // Boss parts take priority over the body they sit on.
  const boss = mk({ parts: [{ id: 'core', weak: true, exposed: true, destroyed: false, box: [0, 0, 0.4, 0.3] }] });
  const pb = partBox(boss, boss.parts[0], cover);
  const ph = hitZone(boss, pb.x + pb.w / 2, pb.y + pb.h / 2, cover);
  ok('a weak boss part reads as a headshot zone', ph.zone === 'head' && ph.part.id === 'core');
  boss.parts[0].destroyed = true;
  ok('a destroyed part stops being a target',
    hitZone(boss, pb.x + pb.w / 2, pb.y + pb.h / 2, cover).zone !== 'head');
  boss.parts[0].destroyed = false;
  boss.parts[0].exposed = false;
  ok('a part gated out of this phase is not a target',
    hitZone(boss, pb.x + pb.w / 2, pb.y + pb.h / 2, cover).zone !== 'head');
}
