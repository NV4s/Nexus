// @ts-check
/**
 * Stage 0 — the tutorial room.
 *
 * Captured live from the arcade build: a green wireframe grid, deliberately
 * unlike any real environment, with the instruction set in very large type
 * across the middle of the screen. Selecting 1-PLAYER SOLO drops straight into
 * it before any story content.
 *
 * One area, and its only job is to teach the pedals. It teaches them in the
 * order the mechanic actually stacks: lean out, duck back (which reloads),
 * then cross to the other cover.
 */

export const STAGE0 = [
  {
    id: '0-0', stage: 0, area: 1, name: 'TRAINING', par: 60, route: 'tutorial',
    script: [
      // 1. Hold a pedal to lean out and shoot. Nothing shoots back yet.
      { say: 'tut.lean' },
      { spawn: [['soldierBlue', 't0', 1]] },
      { hold: 'clear' },

      // 2. Release to take cover, which is also the reload.
      { say: 'tut.cover' },
      { spawn: [['soldierBlue', 't0', 2]] },
      { hold: 'clear' },

      // 3. The other pedal crosses to the other cover position — the mechanic
      //    the whole game is built on.
      { say: 'tut.cross' },
      { spawn: [['soldierBlue', 't1', 2]] },
      { hold: 'clear' },

      // 4. Both sides at once, so the player has to actually move.
      { say: 'tut.both' },
      { spawn: [['soldierBlue', 't0', 2], ['soldierRed', 't1', 2]] },
      { hold: 'clear' },

      { done: true },
    ],
  },
];

export default STAGE0;

export function selfTest(ok) {
  ok('the tutorial is a single area', STAGE0.length === 1);
  ok('it is stage 0', STAGE0[0].stage === 0 && STAGE0[0].id === '0-0');
  ok('it uses the tutorial room', STAGE0[0].route === 'tutorial');
  ok('the script terminates', STAGE0[0].script.some((b) => b.done));

  const s = STAGE0[0].script;
  ok('it teaches in four steps', s.filter((b) => b.say).length === 4);
  ok('leaning is taught first', s.find((b) => b.say).say === 'tut.lean');
  ok('cover and reload come before crossing',
    s.findIndex((b) => b.say === 'tut.cover') < s.findIndex((b) => b.say === 'tut.cross'));
  ok('both sides together come last',
    s.findIndex((b) => b.say === 'tut.both') > s.findIndex((b) => b.say === 'tut.cross'));

  // Only the gentlest archetypes, and no events — this is not a test.
  const kinds = new Set();
  for (const b of s) for (const sp of b.spawn || []) kinds.add(sp[0].split('@')[0]);
  ok('only the weakest tiers appear',
    [...kinds].every((k) => k === 'soldierBlue' || k === 'soldierRed'));
  ok('no events fire during the tutorial', !s.some((b) => b.event));
  ok('no boss', !s.some((b) => b.boss));
  ok('no caution windows to fail', !s.some((b) => b.caution));

  // The final wave must span both cover positions, or step 4 teaches nothing.
  const last = s.filter((b) => b.spawn).pop();
  ok('the last wave spans both cover sides',
    new Set(last.spawn.map((x) => x[1])).size === 2);
  ok('the clock is generous', STAGE0[0].par >= 60);
}
