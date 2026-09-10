import test from 'node:test';
import assert from 'node:assert/strict';

import { checkMessage, checkName } from '../api/_moderation.ts';

const rejected = (input: string) => {
  const verdict = checkMessage(input);
  return verdict.ok ? null : verdict.reason;
};

test('ordinary chat gets through', () => {
  for (const line of [
    'anyone good at bloxorz',
    'i got 135k on cubefield',
    'what level are you on?',
    'gg that was close',
    'Tetris level 9 is unfair',
    'Classic Sussex analysis, mate',
  ]) {
    const verdict = checkMessage(line);
    assert.equal(verdict.ok, true, `${line} was rejected: ${verdict.ok ? '' : verdict.reason}`);
  }
});

test('slurs are blocked however they are spelled', () => {
  for (const line of ['n i g g e r', 'f-a-g-g-o-t', 'niggggger', 'N1GG3R', 'r e t a r d']) {
    assert.equal(rejected(line), 'No slurs in here.', line);
  }
});

test('swearing is blocked, including padded spellings', () => {
  for (const line of ['fuck this', 'what the fuuuuck', 'sh1t', 'you bitch']) {
    assert.equal(rejected(line), 'No swearing in here.', line);
  }
});

test('innocent words that contain rude substrings survive', () => {
  for (const line of ['pass me the class notes', 'i live in Scunthorpe', 'cocktail sausages']) {
    const verdict = checkMessage(line);
    assert.equal(verdict.ok, true, `${line} was rejected: ${verdict.ok ? '' : verdict.reason}`);
  }
});

test('nothing that moves the conversation off-site gets through', () => {
  const cases: [string, string][] = [
    ['come to https://example.com', 'links'],
    ['join discord.gg/whatever', 'Discord invites'],
    ['mail me at someone@example.com', 'email addresses'],
    ['ring 07700 900123 later', 'phone numbers'],
    ['my snap is coolkid99', 'social handles'],
    ['add me on there', 'contact swapping'],
    ['i live at 42 Mill Road', 'addresses'],
  ];
  for (const [line, what] of cases) {
    const reason = rejected(line);
    assert.ok(reason && reason.includes(what), `${line} gave ${reason}`);
  }
});

test('shouting and overlong messages are refused', () => {
  assert.equal(rejected('WHY IS NOBODY TALKING'), 'Not all caps.');
  assert.match(rejected('a'.repeat(201)) ?? '', /under 200/);
  assert.equal(rejected('   '), 'Type something first.');
  assert.equal(rejected(42 as unknown as string), 'Message missing.');
});

test('names cannot impersonate the people running it', () => {
  for (const name of ['admin', 'Nexus Staff', 'the moderator', 'OFFICIAL']) {
    const verdict = checkName(name);
    assert.equal(verdict.ok, false, name);
  }
  for (const name of ['alex', 'cube_fan', 'Sam.T', 'player-2']) {
    const verdict = checkName(name);
    assert.equal(verdict.ok, true, `${name} was rejected: ${verdict.ok ? '' : verdict.reason}`);
  }
});

test('names are screened for slurs too', () => {
  assert.equal(checkName('n1gg3r').ok, false);
  assert.equal(checkName('a').ok, false);
  assert.equal(checkName('x'.repeat(20)).ok, false);
});

test('whitespace is normalised rather than preserved', () => {
  const verdict = checkMessage('  hello   there  ');
  assert.equal(verdict.ok, true);
  assert.equal(verdict.ok && verdict.text, 'hello there');
});
