import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wadUrl } from '../src/lib/wad.ts';

test('every shape of GitHub link becomes a path on this domain', () => {
  assert.equal(
    wadUrl({ link: 'https://github.com/freedoom/freedoom/blob/master/wads/freedoom1.wad' }).url,
    '/w/freedoom/freedoom/master/wads/freedoom1.wad',
  );
  assert.equal(
    wadUrl({ link: 'https://raw.githubusercontent.com/freedoom/freedoom/master/wads/freedoom1.wad' }).url,
    '/w/freedoom/freedoom/master/wads/freedoom1.wad',
  );
  assert.equal(
    wadUrl({ link: 'https://cdn.jsdelivr.net/gh/freedoom/freedoom@v0.13.0/wads/freedoom1.wad' }).url,
    '/w/freedoom/freedoom/v0.13.0/wads/freedoom1.wad',
  );
  assert.equal(
    wadUrl({ link: 'https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0.zip' }).url,
    '/wd/freedoom/freedoom/v0.13.0/freedoom-0.13.0.zip',
  );
  assert.equal(
    wadUrl({ link: 'https://github.com/freedoom/freedoom', file: 'wads/freedoom1.wad' }).url,
    '/w/freedoom/freedoom/HEAD/wads/freedoom1.wad',
  );
});

test('a name with spaces or brackets survives the trip', () => {
  assert.equal(
    wadUrl({ link: 'https://github.com/a/b/blob/main/wads/Hell Revealed (1997).wad' }).url,
    '/w/a/b/main/wads/Hell%20Revealed%20(1997).wad',
  );
});

test('a link with nothing to load says so instead of guessing', () => {
  assert.match(wadUrl({ link: '' }).error ?? '', /No file set yet/);
  assert.match(wadUrl({ link: 'https://github.com/freedoom/freedoom' }).error ?? '', /not at a file/);
  assert.match(wadUrl({ link: 'https://example.com/doom.wad' }).error ?? '', /GitHub link/);
});

test('a path already on this site is left alone', () => {
  assert.equal(wadUrl({ link: '/i/mywad.wad' }).url, '/i/mywad.wad');
});
