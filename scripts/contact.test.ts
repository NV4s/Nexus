import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import { server, reset } from './redis-stub.mjs';

const SID = '11111111-1111-4111-8111-111111111111';
const VID = '33333333-3333-4333-8333-333333333333';
const VID2 = '44444444-4444-4444-8444-444444444444';

type Handler = (req: unknown, res: unknown) => Promise<void> | void;
type Message = { id: string; type: string; subject: string; body: string; at: number; tz: string; who: string };

let contact: Handler;
let moderate: Handler;
let adminCookie = '';

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

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'stub';
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-secret';

  const lib = await import('../api/_lib.ts');
  adminCookie = `nx_admin=${await lib.issueToken()}`;
  contact = (await import('../api/contact.ts')).default as Handler;
  moderate = (await import('../api/admin/moderate.ts')).default as Handler;
});

after(() => server.close());

beforeEach(() => reset());

const report = (fields: Record<string, unknown> = {}, vid = VID) =>
  call(contact, 'POST', {
    sid: SID,
    vid,
    type: 'blocked',
    subject: 'The site would not open this morning',
    body: 'Started: 9:10 am\nWorked again: 10:45 am\nNetwork: school wifi\nWhat: the whole site',
    tz: 'America/Chicago',
    ...fields,
  });

const inbox = async () =>
  ((await call(contact, 'GET', undefined, adminCookie)).body as { messages: Message[] }).messages;

test('a site-not-loading report is stored with its details and a short sender id', async () => {
  const sent = await report();
  assert.equal(sent.status, 200);

  const [message] = await inbox();
  assert.equal(message.type, 'blocked');
  assert.equal(message.subject, 'The site would not open this morning');
  assert.match(message.body, /Worked again: 10:45 am/);
  assert.equal(message.tz, 'America/Chicago');
  assert.equal(message.who, VID.slice(0, 8));
  assert.ok(Math.abs(Date.now() - message.at) < 5000);
});

test('the inbox is private to the owner', async () => {
  await report();
  assert.equal((await call(contact, 'GET', undefined)).status, 401);
  assert.equal((await call(contact, 'DELETE', { id: '*' })).status, 401);
  assert.equal((await inbox()).length, 1);
});

test('bad input is refused on the server and nothing is stored', async () => {
  assert.equal((await report({ type: 'spam' })).status, 400);
  assert.equal((await report({ subject: 'hi' })).status, 400);
  assert.equal((await report({ body: 'too short' })).status, 400);
  assert.equal((await report({ subject: 'x'.repeat(121) })).status, 400);
  assert.equal((await report({ body: 'x'.repeat(3001) })).status, 400);
  assert.equal((await report({ vid: 'not-a-uuid' })).status, 400);
  assert.equal((await inbox()).length, 0);
});

test('every type in the dropdown is accepted', async () => {
  for (const [index, type] of ['blocked', 'bug', 'game', 'suggestion', 'other'].entries()) {
    const vid = `${String(index + 5).repeat(8)}-5555-4555-8555-555555555555`;
    assert.equal((await report({ type }, vid)).status, 200, type);
  }
  assert.equal((await inbox()).length, 5);
});

test('the hidden field swallows bots without storing anything', async () => {
  const bot = await report({ website: 'http://spam.example' });
  assert.equal(bot.status, 200);
  assert.equal((await inbox()).length, 0);
});

test('a flood from one browser is cut off', async () => {
  const results = [];
  for (let i = 0; i < 5; i++) results.push((await report({ subject: `Report number ${i}` })).status);
  assert.deepEqual(results, [200, 200, 200, 429, 429]);
  assert.equal((await report({}, VID2)).status, 200, 'another browser is unaffected');
});

test('a blocked visitor cannot send', async () => {
  assert.equal((await call(moderate, 'POST', { action: 'block', id: VID }, adminCookie)).status, 200);
  const refused = await report();
  assert.equal(refused.status, 403);
  assert.equal((await inbox()).length, 0);
});

test('the owner can delete one message or clear the inbox', async () => {
  await report({ subject: 'First report' });
  await report({ subject: 'Second report' }, VID2);

  const [newest] = await inbox();
  assert.equal(newest.subject, 'Second report');
  assert.equal((await call(contact, 'DELETE', { id: newest.id }, adminCookie)).status, 200);
  assert.equal((await inbox()).length, 1);

  assert.equal((await call(contact, 'DELETE', { id: '*' }, adminCookie)).status, 200);
  assert.equal((await inbox()).length, 0);
});
