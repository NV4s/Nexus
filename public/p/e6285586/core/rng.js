/**
 * Seeded PRNG. Every random draw in the simulation goes through here so a run
 * can be reproduced from its seed — which is what makes the headless area
 * harness in selftest.js able to say "area 4-3 soft-locks on seed 7".
 *
 * The arcade build kept three independent streams (gameplay, script, cosmetic)
 * so that visual randomness could never perturb gameplay outcomes. Same idea
 * here, same reason.
 */

/** mulberry32 — small, fast, good enough distribution for a shooter. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  constructor(seed = 1) {
    this.reseed(seed);
  }
  reseed(seed) {
    this.seed = seed >>> 0;
    this.calls = 0;
    this._next = mulberry32(this.seed);
  }
  /** [0,1) */
  next() {
    this.calls++;
    return this._next();
  }
  /** [a,b) */
  range(a, b) {
    return a + this.next() * (b - a);
  }
  /** integer in [a,b] inclusive */
  int(a, b) {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p) {
    return this.next() < p;
  }
  /** Weighted pick. `weights` parallel to `arr`; falls back to uniform if all zero. */
  weighted(arr, weights) {
    let total = 0;
    for (const w of weights) total += w;
    if (total <= 0) return this.pick(arr);
    let r = this.next() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }
}

/** The three streams. `game` decides outcomes; `visual` must never touch them. */
export const rng = {
  game: new Rng(1),
  script: new Rng(2),
  visual: new Rng(3),
  reseedAll(seed) {
    this.game.reseed(seed);
    this.script.reseed(seed + 1013);
    this.visual.reseed(seed + 7919);
  },
};

export function selfTest(ok) {
  const a = new Rng(42), b = new Rng(42);
  const seqA = [a.next(), a.next(), a.next()];
  const seqB = [b.next(), b.next(), b.next()];
  ok('rng is deterministic for a given seed', seqA.join() === seqB.join());
  ok('rng stays in [0,1)', seqA.every((v) => v >= 0 && v < 1));

  const c = new Rng(9);
  ok('rng.int respects inclusive bounds', (() => {
    for (let i = 0; i < 500; i++) { const v = c.int(2, 5); if (v < 2 || v > 5 || v % 1) return false; }
    return true;
  })());

  const d = new Rng(5);
  ok('rng.weighted never picks a zero-weight option', (() => {
    for (let i = 0; i < 300; i++) if (d.weighted(['a', 'b'], [0, 1]) !== 'b') return false;
    return true;
  })());

  // Reseeding must rewind the stream, or the sim harness cannot reproduce runs.
  const e = new Rng(77);
  const first = e.next();
  e.reseed(77);
  ok('reseed rewinds the stream', e.next() === first);

  rng.reseedAll(3);
  const g1 = rng.game.next();
  rng.visual.next(); rng.visual.next();
  rng.reseedAll(3);
  ok('visual draws cannot perturb the game stream', rng.game.next() === g1);
}
