import { configured, redis, requireAdmin, send, type Req, type Res } from './_lib.js';

const INBOX = 'contact:inbox';
const KEEP = 500;
const UUID = /^[0-9a-f-]{36}$/;

export const CONTACT_TYPES = ['blocked', 'bug', 'game', 'suggestion', 'other'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export type ContactMessage = {
  id: string;
  type: ContactType;
  subject: string;
  body: string;
  at: number;
  tz: string;
  who: string;
};

const SUBJECT = { min: 3, max: 120 };
const BODY = { min: 10, max: 3000 };

const clean = (value: unknown) =>
  typeof value === 'string'
    ? value
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
    : '';

const parse = (raw: unknown): ContactMessage[] =>
  (Array.isArray(raw) ? raw : []).flatMap((entry) => {
    try {
      return [JSON.parse(String(entry)) as ContactMessage];
    } catch {
      return [];
    }
  });

export default async function handler(req: Req, res: Res) {
  if (req.method === 'GET') {
    if (!(await requireAdmin(req, res))) return;
    const [raw] = (await redis([['LRANGE', INBOX, 0, KEEP - 1]])) ?? [];
    return send(res, 200, { messages: parse(raw) });
  }

  if (req.method === 'DELETE') {
    if (!(await requireAdmin(req, res))) return;
    const id = String((req.body as { id?: unknown })?.id ?? '');

    if (id === '*') {
      await redis([['DEL', INBOX]]);
      return send(res, 200, { cleared: true });
    }

    const [raw] = (await redis([['LRANGE', INBOX, 0, KEEP - 1]])) ?? [];
    const target = (Array.isArray(raw) ? raw : []).find((entry) => {
      try {
        return (JSON.parse(String(entry)) as ContactMessage).id === id;
      } catch {
        return false;
      }
    });
    if (!target) return send(res, 404, { error: 'Already gone.' });

    await redis([['LREM', INBOX, 1, String(target)]]);
    return send(res, 200, { deleted: id });
  }

  if (req.method !== 'POST') return send(res, 405);
  if (!configured()) return send(res, 503, { error: 'Messages are not set up on this deployment yet.' });

  const input = (req.body ?? {}) as Record<string, unknown>;
  const sid = typeof input.sid === 'string' && UUID.test(input.sid) ? input.sid : null;
  const vid = typeof input.vid === 'string' && UUID.test(input.vid) ? input.vid : null;
  if (!sid || !vid) return send(res, 400, { error: 'Reload the page and try again.' });

  if (clean(input.website)) return send(res, 200, { ok: true });

  const type = CONTACT_TYPES.find((option) => option === input.type);
  if (!type) return send(res, 400, { error: 'Pick what this is about.' });

  const subject = clean(input.subject).replace(/\s+/g, ' ');
  if (subject.length < SUBJECT.min) return send(res, 400, { error: 'Add a short subject.' });
  if (subject.length > SUBJECT.max) {
    return send(res, 400, { error: `Keep the subject under ${SUBJECT.max} characters.` });
  }

  const body = clean(input.body);
  if (body.length < BODY.min) return send(res, 400, { error: 'Add a few more details.' });
  if (body.length > BODY.max) return send(res, 400, { error: `Keep it under ${BODY.max} characters.` });

  const tz = clean(input.tz).slice(0, 64);

  const state = await redis([
    ['HMGET', 'mod', `b:${vid}`],
    ['INCR', `contact:rate:${vid}`],
    ['EXPIRE', `contact:rate:${vid}`, 600],
    ['INCR', `contact:day:${vid}`],
    ['EXPIRE', `contact:day:${vid}`, 86_400],
  ]);
  if (!state) return send(res, 503, { error: 'Could not send right now. Try again in a minute.' });

  const [blocked] = Array.isArray(state[0]) ? (state[0] as (string | null)[]) : [];
  if (blocked) return send(res, 403, { error: 'You are blocked.', blocked: true });
  if (Number(state[1] ?? 0) > 3) {
    return send(res, 429, { error: 'That is a few messages already. Try again in ten minutes.' });
  }
  if (Number(state[3] ?? 0) > 10) return send(res, 429, { error: 'That is enough messages for today.' });

  const entry: ContactMessage = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    type,
    subject,
    body,
    at: Date.now(),
    tz,
    who: vid.slice(0, 8),
  };

  await redis([
    ['LPUSH', INBOX, JSON.stringify(entry)],
    ['LTRIM', INBOX, 0, KEEP - 1],
  ]);

  return send(res, 200, { ok: true, id: entry.id });
}
