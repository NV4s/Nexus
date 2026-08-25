import { redis, send, type Req, type Res } from './_lib';

/** Both values reach the admin's screen and a Redis field, so validate them here. */
const SID = /^[0-9a-f-]{36}$/;
const PAGE = /^[a-z0-9/-]{0,64}$/;

const PRESENCE_TTL_S = 900;
const DAY_MS = 86_400_000;

export default async function handler(req: Req, res: Res) {
  // Always 204, whatever happened. A visitor learns nothing from this endpoint,
  // and a tracking failure must never look like a broken site.
  if (req.method !== 'POST') return send(res, 204);

  const body = (req.body ?? {}) as {
    sid?: unknown;
    page?: unknown;
    started?: unknown;
    first?: unknown;
  };

  const sid = typeof body.sid === 'string' && SID.test(body.sid) ? body.sid : null;
  if (!sid) return send(res, 204);

  const page = typeof body.page === 'string' && PAGE.test(body.page) ? body.page : '?';
  const now = Date.now();

  // The session's start rides along on every beat, because HSET replaces the whole
  // field and re-reading it first would cost an extra command per beat. It is
  // client-supplied, so clamp it: a bogus value would only skew the dwell column,
  // but there is no reason to render someone's idea of a 40-year session.
  const claimed = typeof body.started === 'number' ? body.started : now;
  const started = claimed > now || now - claimed > DAY_MS ? now : claimed;

  const record = JSON.stringify({ p: page, s: started, t: now });

  await redis(
    body.first === true
      ? [
          ['INCR', 'visits:total'],
          ['HINCRBY', 'visits:daily', new Date().toISOString().slice(0, 10), 1],
          ['HSET', 'presence', sid, record],
          // Refreshed on every new session, so a live site never lets it lapse.
          ['EXPIRE', 'presence', PRESENCE_TTL_S],
        ]
      : [['HSET', 'presence', sid, record]],
  );

  return send(res, 204);
}
