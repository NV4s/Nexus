import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SWFDUMP_SHA } from '../src/data/swfdump.ts';
import { migrateSaveKeys } from '../src/lib/saves.ts';

const OLD_SHA = 'a'.repeat(40);
const VALUE = 'AL8AAAAt';

/** In node there is no location, so HOST is '' and the host-carrying shapes
 *  collapse to a leading slash. The browser puts its own host there. */
test('saves written against the old CDN urls follow the SWFs to /m, /mr and /ml', () => {
  localStorage.clear();
  localStorage.setItem(`localstorage://cdn.jsdelivr.net/gh/NV4s/swfdump@${OLD_SHA}/Bloxorz.swf/save`, VALUE);
  localStorage.setItem(`localstorage://gh/NV4s/swfdump@${OLD_SHA}/Avalanche.swf/ag2007`, VALUE);
  localStorage.setItem(`localstorage://raw.githubusercontent.com/NV4s/swfdump/${OLD_SHA}/Big.swf/x`, VALUE);
  localStorage.setItem('unrelated', VALUE);

  migrateSaveKeys();

  const keys = Object.keys(localStorage);
  assert.ok(keys.some((key) => key === `localstorage:///m/${SWFDUMP_SHA}/Bloxorz.swf/save`), keys.join('\n'));
  assert.ok(keys.some((key) => key === `localstorage://m/${SWFDUMP_SHA}/Avalanche.swf/ag2007`), keys.join('\n'));
  assert.ok(keys.some((key) => key === `localstorage:///mr/${SWFDUMP_SHA}/Big.swf/x`), keys.join('\n'));
  assert.equal(localStorage.getItem('unrelated'), VALUE);
  assert.equal(keys.filter((key) => key.includes('swfdump')).length, 0);
});

test('a key already on the new path just gets its sha refreshed, once', () => {
  localStorage.clear();
  localStorage.setItem(`localstorage://example.com/m/${OLD_SHA}/Bloxorz.swf/save`, VALUE);

  migrateSaveKeys();
  migrateSaveKeys();

  assert.equal(
    localStorage.getItem(`localstorage://example.com/m/${SWFDUMP_SHA}/Bloxorz.swf/save`),
    VALUE,
  );
  assert.equal(Object.keys(localStorage).length, 1);
});
