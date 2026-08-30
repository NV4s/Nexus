// @ts-check
/**
 * Camera and projection.
 *
 * Cheap pseudo-3D, carried over from the single-file build: depth 0 is the far
 * wall, 1 is right in front of the player, and everything scales and drifts
 * outward from the vanishing point. What changed is where the eye is — it now
 * comes from the occupied cover slot rather than a fixed left/right offset, so
 * moving down the rail actually re-frames the scene.
 */

import { TC } from '../core/tune.js';
import { getSlot } from './cover.js';

export const W = TC.RES_X;
export const H = TC.RES_Y;
export const HORIZON = H * 0.46;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/**
 * Eye position in world units for the current cover state.
 * Hidden sits at the slot's `cam`; fully leaned sits at cam+lean; mid-traversal
 * interpolates between the two slots so the run reads as movement, not a cut.
 */
export function eye(cover) {
  if (cover.moving) {
    const a = getSlot(cover.route, cover.moving.from).cam;
    const b = getSlot(cover.route, cover.moving.to).cam;
    const t = clamp(cover.moving.t / cover.moving.dur, 0, 1);
    // Ease so the run settles rather than stopping dead.
    const e = t * t * (3 - 2 * t);
    return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
  }
  const slot = getSlot(cover.route, cover.slot);
  const { cam, lean } = slot;
  const t = cover.exposure;
  return [cam[0] + lean[0] * t, cam[1] + lean[1] * t, cam[2] + lean[2] * t];
}

/**
 * Project a world point to the screen.
 * `wx` is lateral offset in route units, `depth` is 0..1 toward the player.
 * Returns screen x, the y the actor's feet sit on, and a scale factor.
 */
export function project(wx, depth, cover, height = 0) {
  const d = clamp(depth, 0.05, 1);
  const scale = lerp(0.34, 1.25, d * d);
  const [ex, , ez] = eye(cover);

  // Motion parallax falls out of the depth scale: the lateral term is
  // multiplied by the same curve as size, so near actors sweep across the
  // screen as the eye moves and distant ones barely shift.
  const x = W / 2 + (wx - ex * 0.16) * W * 0.46 * lerp(0.55, 1.25, d);
  const groundY = lerp(HORIZON + 26, H * 0.98, d * d) - height * 120 * scale - ez * 0.6;
  return { x, groundY, scale };
}

/** Horizontal shift applied to backdrop layers, so they track the eye. */
export function backdropShift(cover, layerDepth = 0) {
  return eye(cover)[0] * lerp(28, 150, layerDepth);
}

/**
 * Convert a spawn point (route units) into the depth value the projector wants.
 * Route `z` runs 0 (at the player) to ~40 (far); depth is the inverse.
 */
export function depthFromZ(z, cover) {
  const ez = eye(cover)[2];
  const rel = Math.max(0.5, z - ez);
  return clamp(1 - rel / 40, 0.05, 1);
}

export function selfTest(ok) {
  const route = {
    nodes: [
      { L: { cam: [-3, 1.4, 0], lean: [-1, 0.2, 0.3], sees: [] },
        R: { cam: [3, 1.4, 0], lean: [1, 0.2, 0.3], sees: [] } },
      { L: { cam: [-3, 1.4, 10], lean: [-1, 0.2, 0.3], sees: [] },
        R: { cam: [3, 1.4, 10], lean: [1, 0.2, 0.3], sees: [] } },
    ],
    edges: ['L0R0', 'L0L1'], entry: 'L0',
  };
  const cover = { route, slot: 'L0', side: 'L', node: 0, exposure: 0, moving: null };

  ok('hidden eye sits at the slot camera', eye(cover)[0] === -3);
  cover.exposure = 1;
  ok('leaning out shifts the eye by the lean vector', eye(cover)[0] === -4);

  cover.exposure = 0;
  const left = project(0, 0.5, cover).x;
  const coverR = { ...cover, slot: 'R0', side: 'R' };
  const right = project(0, 0.5, coverR).x;
  ok('opposite slots frame the same point differently', Math.abs(left - right) > 1);

  // Nearer things must be bigger, or the depth cue is inverted.
  ok('scale grows with depth', project(0, 0.9, cover).scale > project(0, 0.2, cover).scale);
  ok('near actors stand lower on screen', project(0, 0.9, cover).groundY > project(0, 0.2, cover).groundY);
  ok('elevation raises an actor', project(0, 0.5, cover, 2).groundY < project(0, 0.5, cover, 0).groundY);

  // Parallax must be depth-dependent, otherwise the scene slides as a flat card.
  const farShift = Math.abs(project(0, 0.1, cover).x - project(0, 0.1, coverR).x);
  const nearShift = Math.abs(project(0, 0.95, cover).x - project(0, 0.95, coverR).x);
  ok('near geometry parallaxes more than far', nearShift > farShift);
  ok('distant geometry still shifts a little', farShift > 0);
  ok('backdrop layers move less the further back they sit',
    Math.abs(backdropShift(cover, 0)) < Math.abs(backdropShift(cover, 1)));

  const moving = { route, slot: 'L0', side: 'L', node: 0, exposure: 1,
                   moving: { from: 'L0', to: 'L1', t: 0.5, dur: 1 } };
  const mid = eye(moving);
  ok('mid-traversal the eye is between the two slots', mid[2] > 0 && mid[2] < 10);

  ok('depthFromZ puts distant spawns near the horizon', depthFromZ(38, cover) < depthFromZ(6, cover));
  ok('depth stays inside the projector range', depthFromZ(999, cover) >= 0.05 && depthFromZ(0, cover) <= 1);
}
