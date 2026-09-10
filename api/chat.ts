import { configured, redis, requireAdmin, send, type Req, type Res } from './_lib.js';
import { checkMessage, checkName } from './_moderation.js';

const LOG = 'chat:log';
const MOD = 'mod';
const KEEP = 60;

const UUID = /^[0-9a-f-]{36}$/;

export type ChatMessage = {
  id: string;
  name: string;
  text: string;
  at: number;

  who: string;
};


let cache: { at: number; messages: ChatMessage[] } | null = null;
const CACHE_MS = 3000;


export const resetCache = () => {
  cache = null;
};

const parse = (raw: unknown): ChatMessage[] =>
  (Array.isArray(raw) ? raw : [])
    .map((entry) => {
      try {
        return JSON.parse(String(entry)) as ChatMessage;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is ChatMessage => Boolean(entry))
    .reverse();

async function readLog(): Promise<ChatMessage[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.messages;
  const [raw] = (await redis([['LRANGE', LOG, 0, KEEP - 1]])) ?? [];
  const messages = parse(raw);
  cache = { at: now, messages };
  return messages;
}

export default async function handler(req: Req, res: Res) {
  if (!configured()) return send(res, 200, { messages: [], off: true });

  if (req.method === 'GET') {
    return send(res, 200, { messages: await readLog() });
  }

  if (req.method === 'DELETE') {
    if (!(await requireAdmin(req, res))) return;
    const id = String((req.body as { id?: unknown })?.id ?? '');

    if (id === '*') {
      await redis([['DEL', LOG]]);
      cache = null;
      return send(res, 200, { cleared: true });
    }

    const [raw] = (await redis([['LRANGE', LOG, 0, KEEP - 1]])) ?? [];
    const target = (Array.isArray(raw) ? raw : []).find((entry) => {
      try {
        return (JSON.parse(String(entry)) as ChatMessage).id === id;
      } catch {
        return false;
      }
    });
    if (!target) return send(res, 404, { error: 'Already gone.' });

    await redis([['LREM', LOG, 1, String(target)]]);
    cache = null;
    return send(res, 200, { deleted: id });
  }

  if (req.method !== 'POST') return send(res, 405);

  const body = (req.body ?? {}) as Record<string, unknown>;
  const sid = typeof body.sid === 'string' && UUID.test(body.sid) ? body.sid : null;
  const vid = typeof body.vid === 'string' && UUID.test(body.vid) ? body.vid : null;
  if (!sid || !vid) return send(res, 400, { error: 'Reload the page and try again.' });

  const name = checkName(body.name);
  if (!name.ok) return send(res, 400, { error: name.reason });

  const message = checkMessage(body.text);
  if (!message.ok) return send(res, 400, { error: message.reason });

  const state = await redis([
    ['HMGET', MOD, `m:${vid}`, `b:${vid}`, 'chatOff'],
    ['INCR', `chat:rate:${sid}`],
    ['EXPIRE', `chat:rate:${sid}`, 10],
    ['INCR', `chat:slow:${sid}`],
    ['EXPIRE', `chat:slow:${sid}`, 300],
  ]);

  const [muted, blocked, off] = Array.isArray(state?.[0]) ? (state[0] as (string | null)[]) : [];
  if (off) return send(res, 403, { error: 'Chat is switched off right now.' });
  if (muted) return send(res, 403, { error: 'You are muted in chat.', muted: true });
  if (blocked) return send(res, 403, { error: 'You are blocked.', blocked: true });

  if (Number(state?.[1] ?? 0) > 3) return send(res, 429, { error: 'Slow down a moment.' });
  if (Number(state?.[3] ?? 0) > 25) return send(res, 429, { error: 'That is enough for now.' });

  const entry: ChatMessage = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name: name.text,
    text: message.text,
    at: Date.now(),
    who: vid.slice(0, 8),
  };

  await redis([
    ['LPUSH', LOG, JSON.stringify(entry)],
    ['LTRIM', LOG, 0, KEEP - 1],
  ]);
  cache = null;

  return send(res, 200, { message: entry });
}
