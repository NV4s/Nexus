/**
 * Achievement rescan check:
 *   node --localstorage-file=<tmp> --test scripts/rescan.test.ts
 *
 * This covers the bug that prompted it: a Cubefield save reading 135,000 with
 * none of its score tiers ticked. The rules were right all along — what was
 * missing was anything that re-read the save once the game page had closed.
 * `applyAuto` only ever ran from `markPlayed` on open and `commit` on exit, so
 * a score set during play was noticed only if the page happened to still be
 * mounted. Close the tab, open the achievements list, and nothing had looked.
 *
 * So the test deliberately never opens a game. It plants a save the way Ruffle
 * would, calls `rescanAll()`, and expects the tiers to be ticked — which is
 * exactly what the old code could not do.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const CUBEFIELD_SOL = 'AL8AAAAtVENTTwAEAAAAAAAJY3ViZWZpZWxkAAAAAAAIVG9wU2NvcmUAQNZZQAAAAAAA';

/**
 * The real fixture with one number changed.
 *
 * Building a .sol from scratch here would test my own encoder rather than the
 * decoder; patching the eight bytes of the double in a file Flash actually
 * wrote keeps every other byte honest.
 */
function cubefieldSaveWorth(score: number): string {
  const bytes = Buffer.from(CUBEFIELD_SOL, 'base64');
  const at = bytes.indexOf(Buffer.from('TopScore', 'latin1')) + 'TopScore'.length;
  assert.ok(at > 8, 'fixture should contain the TopScore key');
  assert.equal(bytes[at], 0x00, 'AMF0 number marker should follow the key');
  bytes.writeDoubleBE(score, at + 1);
  return bytes.toString('base64');
}

const reset = () => localStorage.clear();

/** Ruffle keys a SharedObject by the SWF's URL, then the object's own name. */
const plant = (swf: string, object: string, base64: string) =>
  localStorage.setItem(`localhost/swf/${swf}/${object}`, base64);

test('a save written while no game is open still unlocks its tiers', async () => {
  reset();
  const { rescanAll, readUnlocked } = await import('../src/lib/achievements.ts');

  plant('Cubefield.swf', 'cubefield', cubefieldSaveWorth(135000));

  // Nothing has opened Cubefield: no progress, no prior unlocks. This is the
  // state a player is in after setting a score and closing the tab.
  assert.equal(readUnlocked('cubefield').size, 0, 'starts with nothing ticked');

  const scanned = rescanAll();
  assert.ok(scanned >= 1, 'the scan should have found the save');

  const unlocked = readUnlocked('cubefield');
  assert.ok(unlocked.has('score-5k'), '135,000 clears 5,000');
  assert.ok(unlocked.has('score-20k'), '135,000 clears 20,000');
  assert.ok(unlocked.has('score-50k'), '135,000 clears 50,000');
});

test('the tiers a score has not reached stay locked', async () => {
  reset();
  const { rescanAll, readUnlocked } = await import('../src/lib/achievements.ts');

  plant('Cubefield.swf', 'cubefield', cubefieldSaveWorth(22885));
  rescanAll();

  const unlocked = readUnlocked('cubefield');
  assert.ok(unlocked.has('score-5k'));
  assert.ok(unlocked.has('score-20k'));
  assert.equal(unlocked.has('score-50k'), false, '22,885 is short of 50,000');
});

test('playtime rules are re-evaluated too, not just saves', async () => {
  reset();
  const { rescanAll, readUnlocked } = await import('../src/lib/achievements.ts');

  // Sessions were stuck behind the same door: nothing re-checked them either
  // once the game page had gone. Two games because no list carries both a time
  // objective and a session one — each picks whichever suits the game.
  localStorage.setItem('nexus:play:snake', JSON.stringify({ seconds: 4000, sessions: 6 }));
  localStorage.setItem('nexus:play:boxhead', JSON.stringify({ seconds: 4000, sessions: 1 }));
  rescanAll();

  assert.ok(readUnlocked('snake').has('sessions5'), 'six sessions clears the five-session rule');
  assert.ok(readUnlocked('boxhead').has('time30'), '4,000 seconds is past thirty minutes');
  assert.equal(readUnlocked('boxhead').has('time120'), false, 'but not past two hours');
});

test('an auto rule only unlocks an objective the game actually lists', () => {
  // Snake has no thirty-minute objective, so 4,000 seconds must not invent one.
  // Without this the rescan could quietly add ids no page ever renders, which
  // would inflate every "unlocked" count on the achievements page.
  assert.equal(readUnlockedFor('snake').has('time30'), false);
});

/** Reads without re-scanning, for assertions about what the last scan wrote. */
function readUnlockedFor(slug: string): Set<string> {
  return new Set(JSON.parse(localStorage.getItem(`nexus:ach:${slug}`) ?? '[]') as string[]);
}

test('rescanning is safe to repeat and never takes an unlock away', async () => {
  reset();
  const { rescanAll, readUnlocked } = await import('../src/lib/achievements.ts');

  plant('Cubefield.swf', 'cubefield', cubefieldSaveWorth(135000));
  rescanAll();
  const first = [...readUnlocked('cubefield')].sort();

  // Deleting the save must not un-tick anything: the achievement records that
  // something happened, and it did.
  localStorage.removeItem('localhost/swf/Cubefield.swf/cubefield');
  rescanAll();
  assert.deepEqual([...readUnlocked('cubefield')].sort(), first, 'unlocks survive the save');

  rescanAll();
  assert.deepEqual([...readUnlocked('cubefield')].sort(), first, 'and a second pass changes nothing');
});

test('an empty device scans cleanly rather than throwing', async () => {
  reset();
  const { rescanAll } = await import('../src/lib/achievements.ts');
  assert.equal(rescanAll(), 0);
});
