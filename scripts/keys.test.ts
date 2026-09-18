import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAT_PREFIX, K, UNLOCKED_PREFIX, migrateKeys } from '../src/lib/keys.ts';

const RUFFLE_SAVE =
  'localstorage://https://cdn.jsdelivr.net/gh/NV4s/swfdump@abc/Bloxorz.swf/bloxorz_save';

test('old names move over, values intact', () => {
  localStorage.clear();
  localStorage.setItem('theme', 'ember');
  localStorage.setItem('panicCombo', 'ctrl+`');
  localStorage.setItem('nexus:ach:bloxorz', '["first-win"]');
  localStorage.setItem('nexus:chat:name', 'Alex');
  localStorage.setItem('nexus:chat:anthropic:claude-opus-5', '[]');
  localStorage.setItem(RUFFLE_SAVE, 'AL8AAAAt');

  migrateKeys(localStorage);

  assert.equal(localStorage.getItem(K.theme), 'ember');
  assert.equal(localStorage.getItem(K.combo), 'ctrl+`');
  assert.equal(localStorage.getItem(`${UNLOCKED_PREFIX}bloxorz`), '["first-win"]');
  // The fixed name is checked first, so this does not land under the chat family.
  assert.equal(localStorage.getItem(K.chatName), 'Alex');
  assert.equal(localStorage.getItem(`${CHAT_PREFIX}anthropic:claude-opus-5`), '[]');
  assert.equal(localStorage.getItem('theme'), null);
  assert.equal(localStorage.getItem('nexus:ach:bloxorz'), null);
  // Ruffle owns its own key format. Renaming it would lose the save.
  assert.equal(localStorage.getItem(RUFFLE_SAVE), 'AL8AAAAt');
});

test('a value already under the new name wins, and a second run is a no-op', () => {
  localStorage.clear();
  localStorage.setItem(K.theme, 'forest');
  localStorage.setItem('theme', 'ember');

  migrateKeys(localStorage);
  migrateKeys(localStorage);

  assert.equal(localStorage.getItem(K.theme), 'forest');
  assert.equal(localStorage.getItem('theme'), null);
});
