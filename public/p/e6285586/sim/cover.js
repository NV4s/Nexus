// @ts-check
/**
 * Cover Movement System — the arcade called it HSM.
 *
 * Cover is not a fixed left/right pair. It is a graph of numbered nodes along
 * the rail; each node carries a Left and a Right slot, and the pedals traverse
 * edges between slots. The original's edge names survive in its Kismet symbols
 * (HSM_L0R0, HSM_L3L4, HSM_L3R4, HSM_R4L5, HSM_L9R10, HSM_R10L10 ...), and
 * routes here are authored in exactly that notation so recovered data pastes in
 * unchanged.
 *
 * Slot id = side letter + node index: 'L0', 'R3', 'L10'.
 * Edge id = from-slot concatenated with to-slot: 'L0R0', 'L9R10'.
 *
 * Control model, per the shipped config (bReversePlayerCoverInput=true) and the
 * game's own tutorial text ("Step on the pedals to move between right and left
 * cover positions!", "Release the pedal to take cover! You will also reload."):
 *
 *   held pedal, your side      lean out and shoot
 *   pedal released             duck back, which reloads
 *   fresh press, open edge     traverse to that slot
 *
 * Traversal is edge-triggered on the press, never on the hold. That matters:
 * forward edges start CLOSED and a script beat opens them once an area wants
 * you to move on, and if traversal fired on a held pedal you would be yanked
 * down the rail mid-firefight the instant the script unlocked the next node.
 */

import { T_COVER, T_UNCOVER, TUNING } from '../core/tune.js';

/** Split 'L0R10' into ['L0','R10']. Node indices may be multi-digit. */
export function splitEdge(edge) {
  const to = edge.slice(1).search(/[LR]/) + 1;
  return [edge.slice(0, to), edge.slice(to)];
}

export const slotSide = (slot) => slot[0];
export const slotNode = (slot) => +slot.slice(1);

/** Does this edge connect the two slots of one node? */
export function isLateral(edge) {
  const [from, to] = splitEdge(edge);
  return slotNode(from) === slotNode(to);
}

/** Build the adjacency map once per route: { 'L0': ['R0','L1'], ... } */
export function buildAdjacency(route) {
  const adj = Object.create(null);
  for (const edge of route.edges) {
    const [from, to] = splitEdge(edge);
    (adj[from] || (adj[from] = [])).push(to);
  }
  return adj;
}

export function slotExists(route, slot) {
  const node = route.nodes[slotNode(slot)];
  return !!(node && node[slotSide(slot)]);
}

export function getSlot(route, slot) {
  return route.nodes[slotNode(slot)][slotSide(slot)];
}

/**
 * Every slot reachable from `entry` if every edge in the route were open.
 * The content validator uses this to prove an area is completable.
 */
export function reachableSlots(route, adj = buildAdjacency(route)) {
  const seen = new Set([route.entry]);
  const stack = [route.entry];
  while (stack.length) {
    for (const next of adj[stack.pop()] || []) {
      if (!seen.has(next)) { seen.add(next); stack.push(next); }
    }
  }
  return seen;
}

export function createCover(route) {
  return {
    route,
    adj: buildAdjacency(route),
    slot: route.entry,
    side: slotSide(route.entry),
    node: slotNode(route.entry),
    exposure: 0,
    /** {from, to, t, dur} while running between slots, else null */
    moving: null,
    /**
     * Edge ids currently traversable. Only the lateral edges of each node are
     * open at the start — advancing down the rail is script-gated, exactly as
     * Kismet gated it.
     */
    open: new Set(route.openAtStart || route.edges.filter(isLateral)),
    prevL: false,
    prevR: false,
  };
}

function setSlot(cover, slot) {
  cover.slot = slot;
  cover.side = slotSide(slot);
  cover.node = slotNode(slot);
}

/**
 * Best open edge from the current slot to `side`.
 * Advancing (higher node) wins over a lateral swap when both are open, which is
 * how one pedal serves both jobs.
 */
export function pickEdge(cover, side) {
  const outs = (cover.adj[cover.slot] || []).filter(
    (s) => slotSide(s) === side && cover.open.has(cover.slot + s),
  );
  if (!outs.length) return null;
  let best = outs[0];
  for (const s of outs) if (slotNode(s) > slotNode(best)) best = s;
  return best;
}

/**
 * One frame of cover logic.
 * `onReload` fires the instant the player becomes fully hidden — in this series
 * ducking into cover *is* the reload; there is no reload button.
 * Returns 'arrived' on the frame a traversal completes, else null.
 */
export function updateCover(cover, input, dt, onReload) {
  const freshL = !!input.pedalL && !cover.prevL;
  const freshR = !!input.pedalR && !cover.prevR;
  cover.prevL = !!input.pedalL;
  cover.prevR = !!input.pedalR;

  // Mid-traversal: run it out. You are crossing open ground, so you are
  // exposed, and you cannot change your mind about the destination.
  if (cover.moving) {
    cover.moving.t += dt;
    cover.exposure = 1;
    if (cover.moving.t >= cover.moving.dur) {
      setSlot(cover, cover.moving.to);
      cover.moving = null;
      return 'arrived';
    }
    return null;
  }

  // A fresh press takes an open edge if there is one.
  const pressed = freshL ? 'L' : freshR ? 'R' : null;
  if (pressed) {
    const target = pickEdge(cover, pressed);
    if (target) {
      cover.moving = { from: cover.slot, to: target, t: 0, dur: cover.route.moveDur || TUNING.MOVE_DUR };
      cover.exposure = 1;
      return null;
    }
  }

  const held = input.pedalL && !input.pedalR ? 'L'
    : input.pedalR && !input.pedalL ? 'R'
    : input.pedalL && input.pedalR ? cover.side
    : null;

  // Your own side's pedal leans you out of the slot you are in.
  if (held === cover.side) {
    cover.exposure = Math.min(1, cover.exposure + dt / T_UNCOVER);
    return null;
  }

  // Nothing held, or the other pedal with nowhere to go: take cover.
  const before = cover.exposure;
  cover.exposure = Math.max(0, cover.exposure - dt / T_COVER);
  if (before > 0 && cover.exposure === 0 && onReload) onReload();
  return null;
}

/**
 * Is the player protected from a shot that was aimed at `slot`?
 *
 * Crossing between slots is the game's dodge, not merely travel: a shot aimed
 * at the slot you just left misses once you commit to the run. Running INTO a
 * slot something is aimed at still connects, so a blind dash is not free.
 */
export function isSafeFrom(cover, slot) {
  if (cover.exposure < TUNING.SAFE_EXPOSURE) return true;
  if (cover.moving) return cover.moving.to !== slot;
  return cover.slot !== slot;
}

/** Which spawn groups the player can currently engage. */
export function visibleGroups(cover) {
  if (cover.moving) {
    // Mid-run you can see both ends of the edge. This is the window the Side
    // Attack bonus lives in — you are shooting a group from a slot it was not
    // set up to face.
    const a = getSlot(cover.route, cover.moving.from).sees || [];
    const b = getSlot(cover.route, cover.moving.to).sees || [];
    return new Set([...a, ...b]);
  }
  return new Set(getSlot(cover.route, cover.slot).sees || []);
}

export const canSeeGroup = (cover, group) => visibleGroups(cover).has(group);

/* --------------------------------------------------------------- */

const TEST_ROUTE = {
  nodes: [
    { L: { cam: [-3, 1.4, 0], lean: [-1, 0.2, 0.3], sees: ['g0'] },
      R: { cam: [3, 1.4, 0], lean: [1, 0.2, 0.3], sees: ['g1'] } },
    { L: { cam: [-3, 1.4, 9], lean: [-1, 0.2, 0.3], sees: ['g2'] },
      R: { cam: [3, 1.4, 9], lean: [1, 0.2, 0.3], sees: ['g3'] } },
  ],
  edges: ['L0R0', 'R0L0', 'L0L1', 'L0R1', 'R0R1', 'L1R1', 'R1L1'],
  entry: 'L0',
};

const hold = (l, r) => ({ pedalL: l, pedalR: r });

export function selfTest(ok) {
  ok('splitEdge handles single-digit nodes', splitEdge('L0R0').join() === 'L0,R0');
  // Multi-digit nodes are real: stage 1 runs to area 10 (HSM_L9R10, HSM_R10L10).
  ok('splitEdge handles multi-digit nodes', splitEdge('L9R10').join() === 'L9,R10');
  ok('splitEdge handles two multi-digit nodes', splitEdge('R10L10').join() === 'R10,L10');
  ok('lateral edges are recognised', isLateral('L0R0') && !isLateral('L0L1'));

  const cover = createCover(TEST_ROUTE);
  ok('cover starts at the route entry, hidden', cover.slot === 'L0' && cover.exposure === 0);
  ok('adjacency is built from every edge', cover.adj['L0'].join() === 'R0,L1,R1');
  ok('forward edges start closed', !cover.open.has('L0L1') && !cover.open.has('L0R1'));
  ok('lateral edges start open', cover.open.has('L0R0'));

  // Holding your own side leans you out and must not move you, even though a
  // forward same-side edge exists in the route.
  updateCover(cover, hold(true, false), 1);
  ok('own-side pedal leans out without moving', cover.exposure === 1 && cover.slot === 'L0');

  let reloaded = false;
  updateCover(cover, hold(false, false), 1, () => { reloaded = true; });
  ok('releasing both pedals hides you', cover.exposure === 0);
  ok('reaching full cover triggers the reload', reloaded);
  reloaded = false;
  updateCover(cover, hold(false, false), 1, () => { reloaded = true; });
  ok('reload does not re-fire while already hidden', !reloaded);

  // Opposite pedal swaps to the other cover at this node.
  const c2 = createCover(TEST_ROUTE);
  updateCover(c2, hold(false, true), 0.01);
  ok('opposite pedal starts a traversal', !!c2.moving && c2.moving.to === 'R0');
  ok('you are exposed the moment you break cover', c2.exposure === 1);
  updateCover(c2, hold(false, true), 5);
  ok('traversal completes at the target slot', c2.slot === 'R0' && !c2.moving);
  ok('slot side and node stay in sync', c2.node === 0 && c2.side === 'R');
  updateCover(c2, hold(false, true), 1);
  ok('holding the pedal after arriving leans out', c2.exposure === 1 && c2.slot === 'R0');

  // Once the script opens a forward edge, a fresh press advances, and advancing
  // beats the lateral swap.
  const c3 = createCover(TEST_ROUTE);
  c3.open.add('L0R1');
  updateCover(c3, hold(false, true), 0.01);
  ok('traversal prefers advancing over swapping', c3.moving.to === 'R1');

  const c4 = createCover(TEST_ROUTE);
  c4.open.add('L0L1');
  updateCover(c4, hold(true, false), 0.01);
  ok('a fresh press advances along an opened same-side edge', c4.moving && c4.moving.to === 'L1');

  // The same edge must NOT fire while the pedal is merely held down, or the
  // script opening a forward edge would rip the player out of a firefight.
  const c5 = createCover(TEST_ROUTE);
  updateCover(c5, hold(true, false), 0.5);
  c5.open.add('L0L1');
  updateCover(c5, hold(true, false), 0.5);
  ok('opening an edge under a held pedal does not move you', c5.slot === 'L0' && !c5.moving);

  // Closed edges block traversal rather than silently teleporting.
  const c6 = createCover(TEST_ROUTE);
  c6.open = new Set();
  updateCover(c6, hold(false, true), 0.5);
  ok('a closed edge blocks traversal', !c6.moving && c6.slot === 'L0');
  ok('and blocked, the other pedal just takes cover', c6.exposure === 0);

  // A shot aimed where you were must miss once you have left.
  const c7 = createCover(TEST_ROUTE);
  c7.exposure = 1;
  ok('exposed at the aimed slot is not safe', !isSafeFrom(c7, 'L0'));
  ok('exposed at a different slot is safe', isSafeFrom(c7, 'R1'));
  c7.exposure = 0;
  ok('hidden is safe even at the aimed slot', isSafeFrom(c7, 'L0'));

  const c8 = createCover(TEST_ROUTE);
  updateCover(c8, hold(false, true), 0.01);
  ok('mid-traversal a shot at the slot you left misses', isSafeFrom(c8, 'L0'));
  ok('but running into an aimed slot still connects', !isSafeFrom(c8, c8.moving.to));

  ok('visibility comes from the occupied slot', canSeeGroup(createCover(TEST_ROUTE), 'g0'));
  ok('the other slot at the same node sees different groups', !canSeeGroup(createCover(TEST_ROUTE), 'g1'));
  ok('mid-traversal you can see both ends', canSeeGroup(c8, 'g0') && canSeeGroup(c8, 'g1'));

  ok('all four slots are reachable from entry', reachableSlots(TEST_ROUTE).size === 4);
  ok('slotExists rejects a node the route lacks', !slotExists(TEST_ROUTE, 'L7'));

  // A single-node route must degrade to the old two-lane behaviour exactly.
  const single = {
    nodes: [{ L: { cam: [-3, 1.4, 0], lean: [-1, 0.2, 0.3], sees: ['a'] },
              R: { cam: [3, 1.4, 0], lean: [1, 0.2, 0.3], sees: ['b'] } }],
    edges: ['L0R0', 'R0L0'], entry: 'L0',
  };
  const c9 = createCover(single);
  updateCover(c9, hold(false, true), 0.01);
  updateCover(c9, hold(false, true), 5);
  ok('single-node route still swaps sides', c9.slot === 'R0');
  updateCover(c9, hold(false, false), 5);
  ok('single-node route still hides and reloads', c9.exposure === 0);
}
