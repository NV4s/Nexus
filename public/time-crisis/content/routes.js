// @ts-check
/**
 * Cover-node graphs.
 *
 * Edges are written in the arcade's own notation, the one preserved in its
 * Kismet symbols — HSM_L0R0, HSM_L3L4, HSM_L3R4, HSM_R4L5, HSM_L9R10,
 * HSM_R10L10 — so recovered edge lists paste in unchanged.
 *
 * `sees` is authored, never computed. The original used visibility volumes we
 * do not have, and guessing at them would produce areas that cannot be cleared.
 * Three tokens per slot is cheaper than a geometry system.
 *
 * Lateral edges (LnRn) open by default; forward edges are gated and a script
 * beat opens them, exactly as Kismet gated them.
 */

/**
 * Build a rail of `n` nodes with both slots at each, lateral edges throughout
 * and forward edges in both straight and crossing form. Every real route in the
 * game is this shape with different spacing and visibility, so authoring one
 * helper and varying the data beats hand-writing 52 near-identical graphs.
 *
 * @param {number} n how many nodes along the rail
 * @param {(node:number, side:'L'|'R') => string[]} sees which groups each slot faces
 * @param {object} opts spacing overrides
 */
export function rail(n, sees, opts = {}) {
  const spread = opts.spread ?? 3.1;
  const step = opts.step ?? 9;
  const nodes = [];
  const edges = [];

  for (let i = 0; i < n; i++) {
    const z = i * step;
    nodes.push({
      L: { cam: [-spread, 1.4, z], lean: [-1.05, 0.22, 0.35], sees: sees(i, 'L') },
      R: { cam: [spread, 1.4, z], lean: [1.05, 0.22, 0.35], sees: sees(i, 'R') },
    });
    // lateral pair at this node
    edges.push(`L${i}R${i}`, `R${i}L${i}`);
    if (i < n - 1) {
      // straight advances and crossing advances, both forms the symbols show
      edges.push(`L${i}L${i + 1}`, `R${i}R${i + 1}`, `L${i}R${i + 1}`, `R${i}L${i + 1}`);
    }
  }
  return { nodes, edges, entry: opts.entry ?? 'L0', moveDur: opts.moveDur, groups: {} };
}

/** Attach spawn groups to a route. Points are lateral offset, depth, height. */
export function withGroups(route, groups) {
  return { ...route, groups };
}

/** Two enemies abreast at a depth, the commonest arrangement. */
const pair = (x, z, h = 0) => [{ x: x - 0.3, z, h }, { x: x + 0.35, z: z + 2, h }];
const one = (x, z, h = 0) => [{ x, z, h }];

/* ------------------------------------------------------------------ *
 * Stage 1 — resort hotel. Areas 0 through 10.
 * ------------------------------------------------------------------ */

/** Two-node routes: a lateral pair plus one advance. The stage 1 baseline. */
function twoNode(groupsFor, opts) {
  return withGroups(rail(2, groupsFor, opts), opts.groups);
}

export const ROUTES = {
  /* --- stage 0, the tutorial room --- */
  tutorial: withGroups(
    rail(1, (i, s) => (s === 'L' ? ['t0'] : ['t1'])),
    { t0: one(-0.5, 18), t1: one(0.5, 18) },
  ),

  /* --- stage 1 --- */
  poolDeck: twoNode((i, s) => (i === 0 ? (s === 'L' ? ['a0'] : ['a1']) : (s === 'L' ? ['a2'] : ['a3'])), {
    groups: { a0: pair(-0.9, 19), a1: pair(0.9, 21), a2: pair(-0.7, 17), a3: pair(0.8, 20) },
  }),

  terrace: twoNode((i, s) => (i === 0 ? (s === 'L' ? ['b0', 'b1'] : ['b1']) : (s === 'L' ? ['b2'] : ['b3'])), {
    groups: { b0: pair(-1.1, 22), b1: one(0, 26, 1.6), b2: pair(-0.6, 16), b3: pair(1.0, 19) },
  }),

  fountain: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['c0'] : ['c1'];
      if (i === 1) return s === 'L' ? ['c2'] : ['c3'];
      return s === 'L' ? ['c4'] : ['c5'];
    }),
    {
      c0: pair(-1.0, 20), c1: pair(1.0, 22), c2: pair(-0.8, 18),
      c3: one(0.4, 25, 1.8), c4: pair(-0.5, 16), c5: pair(0.9, 18),
    },
  ),

  lobby: twoNode((i, s) => (i === 0 ? (s === 'L' ? ['d0'] : ['d1']) : (s === 'L' ? ['d2'] : ['d3'])), {
    entry: 'R0',
    groups: { d0: pair(-0.8, 18), d1: pair(0.9, 20), d2: one(-0.4, 24, 1.5), d3: pair(0.7, 17) },
  }),

  suite: twoNode((i, s) => (i === 0 ? (s === 'L' ? ['e0'] : ['e1']) : (s === 'L' ? ['e2'] : ['e3'])), {
    groups: { e0: pair(-0.9, 17), e1: pair(0.8, 19), e2: pair(-0.7, 21), e3: pair(1.0, 23) },
  }),

  craneDeck: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['f0'] : ['f1'];
      if (i === 1) return s === 'L' ? ['f2'] : ['f3'];
      return ['f4'];
    }, { spread: 3.4 }),
    {
      f0: pair(-1.0, 19), f1: pair(1.0, 21), f2: pair(-0.6, 17),
      f3: pair(0.8, 20), f4: one(0, 22),
    },
  ),

  /* --- stage 2: train exteriors, refinery, parking. Area names are the
     recovered SEQ_STAGE2 sequence labels. --- */

  /** Carriage roof. Long and narrow, so the rail runs four nodes. */
  trainRoof: withGroups(
    rail(4, (i, s) => {
      if (i === 0) return s === 'L' ? ['h0'] : ['h1'];
      if (i === 1) return s === 'L' ? ['h2'] : ['h3'];
      if (i === 2) return s === 'L' ? ['h4'] : ['h5'];
      return ['h6'];
    }, { spread: 2.6, step: 7.5 }),
    {
      h0: pair(-0.9, 18), h1: pair(0.9, 20), h2: pair(-0.7, 17),
      h3: pair(0.8, 19), h4: pair(-0.6, 16), h5: pair(0.9, 18), h6: one(0, 21),
    },
  ),

  plantFloor: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['j0'] : ['j1'];
      if (i === 1) return s === 'L' ? ['j2', 'j3'] : ['j3'];
      return s === 'L' ? ['j4'] : ['j5'];
    }, { spread: 3.6 }),
    {
      j0: pair(-1.0, 19), j1: pair(1.0, 21), j2: pair(-0.8, 17),
      j3: one(0.2, 26, 1.9), j4: pair(-0.5, 16), j5: pair(0.9, 19),
    },
  ),

  connectionRoad: withGroups(
    rail(2, (i, s) => (i === 0 ? (s === 'L' ? ['k0'] : ['k1']) : (s === 'L' ? ['k2'] : ['k3'])),
      { spread: 3.2 }),
    { k0: pair(-1.0, 20), k1: pair(1.0, 22), k2: pair(-0.7, 17), k3: pair(0.8, 19) },
  ),

  parking: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['m0'] : ['m1'];
      if (i === 1) return s === 'L' ? ['m2'] : ['m3'];
      return s === 'L' ? ['m4'] : ['m5'];
    }),
    {
      m0: pair(-0.9, 18), m1: pair(0.9, 20), m2: pair(-0.7, 16),
      m3: pair(0.8, 18), m4: pair(-0.6, 21), m5: pair(1.0, 23),
    },
  ),

  /* --- stage 3: highway pursuit, truck beds, half-pipe. Names are the
     recovered SEQ_STAGE3 labels; "Renzoku" is the chain-sequence pair. --- */

  /**
   * Bike pursuit. Shipped as a rail section with forced auto-advance rather
   * than half-pipe physics — a deliberate cut, recorded in REFERENCE.md.
   * ponytail: cosmetic lean instead of a physics body. Revisit only if the
   * section feels hollow in play.
   */
  highway: withGroups(
    rail(2, (i, s) => (i === 0 ? (s === 'L' ? ['n0'] : ['n1']) : (s === 'L' ? ['n2'] : ['n3'])),
      { spread: 2.4, step: 8, moveDur: 0.42 }),
    { n0: pair(-1.0, 17), n1: pair(1.0, 19), n2: pair(-0.8, 15), n3: pair(0.9, 18) },
  ),

  /** Truck bed. Fought from a moving platform, so the rail is short. */
  truckBed: withGroups(
    rail(2, (i, s) => (i === 0 ? (s === 'L' ? ['q0'] : ['q1']) : (s === 'L' ? ['q2', 'q3'] : ['q3'])),
      { spread: 2.2, step: 6 }),
    { q0: pair(-0.9, 16), q1: pair(0.9, 18), q2: pair(-0.7, 20), q3: one(0.2, 24, 1.4) },
  ),

  halfPipe: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['u0'] : ['u1'];
      if (i === 1) return s === 'L' ? ['u2'] : ['u3'];
      return ['u4'];
    }, { spread: 3.8, moveDur: 0.48 }),
    {
      u0: pair(-1.1, 18), u1: pair(1.1, 20), u2: pair(-0.9, 16),
      u3: pair(1.0, 19), u4: one(0, 22),
    },
  ),

  /** Renzoku — back-to-back waves with no let-up, so four nodes to keep moving. */
  chainRun: withGroups(
    rail(4, (i, s) => {
      if (i === 0) return s === 'L' ? ['v0'] : ['v1'];
      if (i === 1) return s === 'L' ? ['v2'] : ['v3'];
      if (i === 2) return s === 'L' ? ['v4'] : ['v5'];
      return s === 'L' ? ['v6'] : ['v7'];
    }, { step: 8 }),
    {
      v0: pair(-0.9, 18), v1: pair(0.9, 20), v2: pair(-0.7, 17), v3: pair(0.8, 19),
      v4: pair(-0.6, 16), v5: pair(0.9, 18), v6: pair(-0.8, 20), v7: pair(1.0, 22),
    },
  ),

  /* --- stage 4: jungle. Eight areas from the map directory; the recording
     confirmed the setting and the sniper sub-event. --- */

  jungleTrail: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['p0'] : ['p1'];
      if (i === 1) return s === 'L' ? ['p2'] : ['p3'];
      return s === 'L' ? ['p4'] : ['p5'];
    }, { spread: 2.9, step: 8.5 }),
    {
      p0: pair(-1.0, 18), p1: pair(1.0, 20), p2: pair(-0.8, 16),
      p3: pair(0.9, 19), p4: pair(-0.6, 21), p5: pair(1.0, 23),
    },
  ),

  /** Canopy clearing: raised firing points, which the sniper event needs. */
  clearing: withGroups(
    rail(2, (i, s) => (i === 0 ? (s === 'L' ? ['r0', 'r1'] : ['r1']) : (s === 'L' ? ['r2'] : ['r3', 'r4'])),
      { spread: 3.5 }),
    {
      r0: pair(-1.1, 19), r1: one(0, 30, 2.4), r2: pair(-0.7, 17),
      r3: pair(0.9, 20), r4: one(0.6, 32, 2.8),
    },
  ),

  ravine: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['w0'] : ['w1'];
      if (i === 1) return s === 'L' ? ['w2'] : ['w3'];
      return ['w4'];
    }, { spread: 4.0 }),
    {
      w0: pair(-1.2, 20), w1: pair(1.2, 22), w2: pair(-0.9, 17),
      w3: pair(1.0, 19), w4: one(0, 24, 1.2),
    },
  ),

  /* --- stage 5: industrial. Five areas from the map directory. --- */

  gantry: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['x0'] : ['x1'];
      if (i === 1) return s === 'L' ? ['x2', 'x3'] : ['x3'];
      return s === 'L' ? ['x4'] : ['x5'];
    }, { spread: 3.3 }),
    {
      x0: pair(-1.0, 19), x1: pair(1.0, 21), x2: pair(-0.8, 17),
      x3: one(0, 28, 2.2), x4: pair(-0.6, 16), x5: pair(0.9, 19),
    },
  ),

  foundry: withGroups(
    rail(2, (i, s) => (i === 0 ? (s === 'L' ? ['y0'] : ['y1']) : (s === 'L' ? ['y2'] : ['y3'])),
      { spread: 3.6 }),
    { y0: pair(-1.1, 18), y1: pair(1.1, 20), y2: pair(-0.8, 16), y3: pair(1.0, 19) },
  ),

  /* --- stage 6: the final stage. Six areas from the map directory. --- */

  hangar: withGroups(
    rail(3, (i, s) => {
      if (i === 0) return s === 'L' ? ['z0'] : ['z1'];
      if (i === 1) return s === 'L' ? ['z2'] : ['z3'];
      return s === 'L' ? ['z4'] : ['z5'];
    }, { spread: 3.8, step: 9.5 }),
    {
      z0: pair(-1.1, 19), z1: pair(1.1, 21), z2: pair(-0.9, 17),
      z3: pair(1.0, 20), z4: pair(-0.7, 22), z5: pair(1.0, 24),
    },
  ),

  /** Carrier deck. Wide and exposed, so the rail runs long. */
  deck: withGroups(
    rail(4, (i, s) => {
      if (i === 0) return s === 'L' ? ['d0'] : ['d1'];
      if (i === 1) return s === 'L' ? ['d2'] : ['d3'];
      if (i === 2) return s === 'L' ? ['d4'] : ['d5'];
      return ['d6'];
    }, { spread: 4.2, step: 10 }),
    {
      d0: pair(-1.2, 20), d1: pair(1.2, 22), d2: pair(-1.0, 18),
      d3: pair(1.0, 20), d4: pair(-0.8, 17), d5: pair(1.1, 19), d6: one(0, 24, 1.4),
    },
  ),

  /** Boss arenas are single-node: the fight is the content, not the traversal. */
  bossArena: withGroups(
    rail(1, (i, s) => (s === 'L' ? ['g0', 'gb'] : ['g1', 'gb'])),
    { g0: pair(-1.1, 20), g1: pair(1.1, 20), gb: one(0, 24) },
  ),
};

export function selfTest(ok) {
  const r = rail(3, () => ['x']);
  ok('a rail builds the requested nodes', r.nodes.length === 3);
  ok('every node carries both slots', r.nodes.every((n) => n.L && n.R));
  ok('lateral edges exist at every node',
    r.edges.includes('L0R0') && r.edges.includes('R1L1') && r.edges.includes('L2R2'));
  ok('straight advances exist', r.edges.includes('L0L1') && r.edges.includes('R1R2'));
  ok('crossing advances exist', r.edges.includes('L0R1') && r.edges.includes('R1L2'));
  ok('no edge advances past the last node',
    !r.edges.some((e) => e.includes('3')));
  ok('the rail starts on the left by default', r.entry === 'L0');
  ok('a rail steps away from the player', r.nodes[2].L.cam[2] > r.nodes[0].L.cam[2]);
  ok('slots sit on opposite sides', r.nodes[0].L.cam[0] < 0 && r.nodes[0].R.cam[0] > 0);
  ok('leaning carries a slot outward',
    r.nodes[0].L.lean[0] < 0 && r.nodes[0].R.lean[0] > 0);

  const named = Object.keys(ROUTES);
  ok('routes are defined', named.length >= 7);
  ok('every route has an entry that exists', named.every((k) => {
    const rt = ROUTES[k];
    const n = +rt.entry.slice(1);
    return !!(rt.nodes[n] && rt.nodes[n][rt.entry[0]]);
  }));
  ok('every route declares spawn groups', named.every((k) => Object.keys(ROUTES[k].groups).length > 0));

  // The check that matters: every declared group must be visible from somewhere,
  // or content authored into it can never be shot.
  ok('every group is seen by at least one slot', named.every((k) => {
    const rt = ROUTES[k];
    const seen = new Set();
    for (const node of rt.nodes) {
      for (const side of ['L', 'R']) if (node[side]) for (const g of node[side].sees) seen.add(g);
    }
    return Object.keys(rt.groups).every((g) => seen.has(g));
  }));

  // And nothing may claim to see a group the route never defines.
  ok('no slot references an undefined group', named.every((k) => {
    const rt = ROUTES[k];
    for (const node of rt.nodes) {
      for (const side of ['L', 'R']) {
        if (node[side] && !node[side].sees.every((g) => g in rt.groups)) return false;
      }
    }
    return true;
  }));

  ok('a route entry may start on the right', ROUTES.lobby.entry === 'R0');
  ok('boss arenas are single-node', ROUTES.bossArena.nodes.length === 1);
}
