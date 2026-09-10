/**
 * Exercises the chat and moderation endpoints against the in-memory Redis stub,
 * so the rate limits, the mute and block paths and the prank hand-off are run
 * rather than reasoned about.
 */
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import { server, reset } from './redis-stub.mjs';

const SID = '11111111-1111-4111-8111-111111111111';
const SID2 = '22222222-2222-4222-8222-222222222222';
const VID = '33333333-3333-4333-8333-333333333333';

type Handler = (req: unknown, res: unknown) => Promise<void> | void;

let chat: Handler;
let moderate: Handler;
let track: Handler;
let resetCache: () => void;

/** Enough of ServerResponse for the handlers, which only set a status and end. */
function fakeRes() {
  const state = { status: 0, body: undefined as unknown, headers: {} as Record<string, string> };
  const res = {
    get statusCode() {
      return state.status;
    },
    set statusCode(value: number) {
      state.status = value;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
    },
    end(payload?: string) {
      state.body = payload ? JSON.parse(payload) : undefined;
    },
  };
  return { res, state };
}

const call = async (handler: Handler, method: string, body: unknown, cookie?: string) => {
  const { res, state } = fakeRes();
  await handler({ method, body, headers: cookie ? { cookie } : {} }, res);
  return state;
};

let adminCookie = '';

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'stub';
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-secret';

  const lib = await import('../api/_lib.ts');
  adminCookie = `nx_admin=${await lib.issueToken()}`;

  const chatModule = await import('../api/chat.ts');
  chat = chatModule.default as Handler;
  resetCache = chatModule.resetCache;
  moderate = (await import('../api/admin/moderate.ts')).default as Handler;
  track = (await import('../api/track.ts')).default as Handler;
});

after(() => server.close());

beforeEach(() => {
  reset();
  resetCache();
});

const post = (text: string, sid = SID, vid = VID, name = 'alex') =>
  call(chat, 'POST', { sid, vid, name, text });

test('a clean message is stored and read back', async () => {
  const sent = await call(chat, 'POST', { sid: SID, vid: VID, name: 'alex', text: 'hello all' });
  assert.equal(sent.status, 200);

  const read = await call(chat, 'GET', undefined);
  const { messages } = read.body as { messages: { name: string; text: string }[] };
  assert.equal(messages.length, 1);
  assert.deepEqual({ name: messages[0].name, text: messages[0].text }, { name: 'alex', text: 'hello all' });
});

test('the filter runs on the server, not just in the browser', async () => {
  const rude = await post('you are a bitch');
  assert.equal(rude.status, 400);

  const linked = await post('meet me at https://example.com');
  assert.equal(linked.status, 400);

  const read = await call(chat, 'GET', undefined);
  assert.equal((read.body as { messages: unknown[] }).messages.length, 0);
});

test('a bad name is refused before the message is looked at', async () => {
  const impostor = await post('hello', SID, VID, 'admin');
  assert.equal(impostor.status, 400);
  assert.match(String((impostor.body as { error: string }).error), /reserved/i);
});

test('a flood is cut off', async () => {
  const results = [];
  for (let i = 0; i < 6; i++) results.push((await post(`message ${i}`)).status);
  assert.deepEqual(results.slice(0, 3), [200, 200, 200]);
  assert.ok(results.slice(3).every((status) => status === 429), results.join(','));
});

test('a muted visitor is refused, and unmuting lets them back in', async () => {
  assert.equal((await call(moderate, 'POST', { action: 'mute', id: VID }, adminCookie)).status, 200);

  const blockedPost = await post('am i still here', SID2);
  assert.equal(blockedPost.status, 403);
  assert.equal((blockedPost.body as { muted?: boolean }).muted, true);

  assert.equal((await call(moderate, 'POST', { action: 'unmute', id: VID }, adminCookie)).status, 200);
  assert.equal((await post('back now', SID2)).status, 200);
});

test('moderation refuses anyone without the admin cookie', async () => {
  const anonymous = await call(moderate, 'POST', { action: 'block', id: VID });
  assert.equal(anonymous.status, 401);

  const listed = await call(moderate, 'POST', { action: 'list', id: '' }, adminCookie);
  assert.deepEqual((listed.body as { blocked: string[] }).blocked, []);
});

test('the owner can delete one message and clear the room', async () => {
  await post('first');
  await post('second', SID2);

  const before = (await call(chat, 'GET', undefined)).body as { messages: { id: string }[] };
  assert.equal(before.messages.length, 2);

  const gone = await call(chat, 'DELETE', { id: before.messages[0].id }, adminCookie);
  assert.equal(gone.status, 200);
  assert.equal(((await call(chat, 'GET', undefined)).body as { messages: unknown[] }).messages.length, 1);

  await call(chat, 'DELETE', { id: '*' }, adminCookie);
  assert.equal(((await call(chat, 'GET', undefined)).body as { messages: unknown[] }).messages.length, 0);
});

test('deleting needs the admin cookie', async () => {
  await post('still here');
  const refused = await call(chat, 'DELETE', { id: '*' });
  assert.equal(refused.status, 401);
  assert.equal(((await call(chat, 'GET', undefined)).body as { messages: unknown[] }).messages.length, 1);
});

test('the chat can be switched off entirely', async () => {
  await call(moderate, 'POST', { action: 'chatOff', id: '' }, adminCookie);
  const refused = await post('anyone about');
  assert.equal(refused.status, 403);

  await call(moderate, 'POST', { action: 'chatOn', id: '' }, adminCookie);
  assert.equal((await post('anyone about')).status, 200);
});

test('a block reaches the browser through the beacon, once', async () => {
  await call(moderate, 'POST', { action: 'block', id: VID }, adminCookie);

  const beat = await call(track, 'POST', { sid: SID, vid: VID, page: '/', first: true });
  assert.equal(beat.status, 200);
  assert.deepEqual(beat.body, { blocked: true });
});

test('a prank is delivered to the session and then cleared', async () => {
  await call(moderate, 'POST', { action: 'troll', id: SID, kind: 'shake' }, adminCookie);

  const first = await call(track, 'POST', { sid: SID, vid: VID, page: '/', first: true });
  assert.equal(first.status, 200);
  assert.equal((first.body as { troll: { kind: string } }).troll.kind, 'shake');

  const second = await call(track, 'POST', { sid: SID, vid: VID, page: '/' });
  assert.equal(second.status, 204, 'a prank must not repeat on every beat');
});

test('an unknown prank is refused', async () => {
  const bad = await call(moderate, 'POST', { action: 'troll', id: SID, kind: 'formatDisk' }, adminCookie);
  assert.equal(bad.status, 400);
});

test('an ordinary beat still answers 204', async () => {
  const beat = await call(track, 'POST', { sid: SID, vid: VID, page: '/arcade', first: true });
  assert.equal(beat.status, 204);
});
