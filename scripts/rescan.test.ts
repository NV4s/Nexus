
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { K } from '../src/lib/keys.ts';

const CUBEFIELD_SOL = 'AL8AAAAtVENTTwAEAAAAAAAJY3ViZWZpZWxkAAAAAAAIVG9wU2NvcmUAQNZZQAAAAAAA';


function cubefieldSaveWorth(score: number): string {
  const bytes = Buffer.from(CUBEFIELD_SOL, 'base64');
  const at = bytes.indexOf(Buffer.from('TopScore', 'latin1')) + 'TopScore'.length;
  assert.ok(at > 8, 'fixture should contain the TopScore key');
  assert.equal(bytes[at], 0x00, 'AMF0 number marker should follow the key');
  bytes.writeDoubleBE(score, at + 1);
  return bytes.toString('base64');
}

const reset = () => localStorage.clear();


const plant = (swf: string, object: string, base64: string) =>
  localStorage.setItem(`localhost/swf/${swf}/${object}`, base64);

test('a save written while no game is open still unlocks its tiers', async () => {
  reset();
  const { rescanAll, readUnlocked } = await import('../src/lib/achievements.ts');

  plant('Cubefield.swf', 'cubefield', cubefieldSaveWorth(135000));



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




  localStorage.setItem(K.progress('snake'), JSON.stringify({ seconds: 4000, sessions: 6 }));
  localStorage.setItem(K.progress('boxhead'), JSON.stringify({ seconds: 4000, sessions: 1 }));
  rescanAll();

  assert.ok(readUnlocked('snake').has('sessions5'), 'six sessions clears the five-session rule');
  assert.ok(readUnlocked('boxhead').has('time30'), '4,000 seconds is past thirty minutes');
  assert.equal(readUnlocked('boxhead').has('time120'), false, 'but not past two hours');
});

test('an auto rule only unlocks an objective the game actually lists', () => {



  assert.equal(readUnlockedFor('snake').has('time30'), false);
});


function readUnlockedFor(slug: string): Set<string> {
  return new Set(JSON.parse(localStorage.getItem(K.unlocked(slug)) ?? '[]') as string[]);
}

test('rescanning is safe to repeat and never takes an unlock away', async () => {
  reset();
  const { rescanAll, readUnlocked } = await import('../src/lib/achievements.ts');

  plant('Cubefield.swf', 'cubefield', cubefieldSaveWorth(135000));
  rescanAll();
  const first = [...readUnlocked('cubefield')].sort();



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
