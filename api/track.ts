import { redis, send, type Req, type Res } from './_lib.js';

/** Every value here reaches the admin's screen or a Redis key, so validate it. */
const UUID = /^[0-9a-f-]{36}$/;
const PAGE = /^[a-z0-9/-]{0,64}$/;

const PRESENCE_TTL_S = 900;
const DAILY_TTL_S = 35 * 24 * 60 * 60;
const VISITOR_TTL_S = 90 * 24 * 60 * 60;
/** Keeps the recent-visitors list from growing without bound. */
const RECENT_KEEP = 200;
const DAY_MS = 86_400_000;

/**
 * Location from Vercel's own edge headers: city, region, country.
 *
 * This is derived from the IP by the edge, and the IP itself is never stored. It
 * is roughly city-accurate, which is as far as this goes on purpose — the
 * browser Geolocation API would give a street-level fix but has to prompt every
 * visitor for permission, and a visitor counter is not a reason to ask a
 * classroom of people to share where they are sitting.
 */
const PLACE = /^[A-Za-z0-9 .'-]{1,40}$/;

function placeOf(req: Req): string | null {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const pick = (name: string) => {
    const value = headers[name];
    if (typeof value !== 'string') return null;
    // Decode first: city names arrive percent-encoded when they contain spaces,
    // and validating the raw form threw away every multi-word city. Validate
    // after, because this is free text from the edge that the admin panel renders.
    let decoded = value;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      return null; // malformed escape — treat as absent rather than guess
    }
    return PLACE.test(decoded) ? decoded : null;
  };

  const country = pick('x-vercel-ip-country');
  if (!country || !/^[A-Z]{2}$/.test(country)) return null;

  return [pick('x-vercel-ip-city'), pick('x-vercel-ip-country-region'), country]
    .filter(Boolean)
    .join(', ');
}

const slugOf = (page: string) => {
  const match = page.match(/^\/(?:game|embed)\/([a-z0-9-]{1,60})$/);
  return match ? match[1] : null;
};

export default async function handler(req: Req, res: Res) {
  // Always 204, whatever happened. A visitor learns nothing from this endpoint,
  // and a tracking failure must never look like a broken site.
  if (req.method !== 'POST') return send(res, 204);

  const body = (req.body ?? {}) as Record<string, unknown>;

  const sid = typeof body.sid === 'string' && UUID.test(body.sid) ? body.sid : null;
  if (!sid) return send(res, 204);
  const vid = typeof body.vid === 'string' && UUID.test(body.vid) ? body.vid : null;

  const page = typeof body.page === 'string' && PAGE.test(body.page) ? body.page : '?';
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  // The session's start rides along on every beat, because HSET replaces the whole
  // field and re-reading it first would cost an extra command per beat. It is
  // client-supplied, so clamp it: a bogus value would only skew the dwell column,
  // but there is no reason to render someone's idea of a 40-year session.
  const claimed = typeof body.started === 'number' ? body.started : now;
  const started = claimed > now || now - claimed > DAY_MS ? now : claimed;

  const commands: (string | number)[][] = [
    ['HSET', 'presence', sid, JSON.stringify({ p: page, s: started, t: now })],
  ];

  if (body.first === true) {
    // Sessions stay their own number rather than being replaced by visitors.
    commands.push(
      ['INCR', 'visits:total'],
      ['HINCRBY', 'visits:daily', today, 1],
      ['EXPIRE', 'presence', PRESENCE_TTL_S],
    );

    if (vid) {
      const place = placeOf(req);
      if (place) {
        commands.push(
          ['HINCRBY', 'visits:places', place, 1],
          ['HSET', `visitor:${vid}`, 'place', place],
        );
      }

      commands.push(
        ['SADD', 'visitors:all', vid],
        ['SADD', `visitors:daily:${today}`, vid],
        ['EXPIRE', `visitors:daily:${today}`, DAILY_TTL_S],
        // Sorted by last seen, so the admin panel can read the recent ones without
        // ever enumerating the whole set.
        ['ZADD', 'visitors:recent', now, vid],
        ['ZREMRANGEBYRANK', 'visitors:recent', 0, -(RECENT_KEEP + 1)],
        ['HSETNX', `visitor:${vid}`, 'first', now],
        ['HINCRBY', `visitor:${vid}`, 'visits', 1],
        ['HSET', `visitor:${vid}`, 'last', now],
        ['EXPIRE', `visitor:${vid}`, VISITOR_TTL_S],
      );
    }
  } else if (vid) {
    commands.push(['HSET', `visitor:${vid}`, 'last', now]);
  }

  // Only on an actual navigation — a beat that repeats the same page adds nothing.
  const slug = body.changed === true && vid ? slugOf(page) : null;
  if (slug && vid) {
    commands.push(
      ['SADD', `visitor:${vid}:games`, slug],
      ['EXPIRE', `visitor:${vid}:games`, VISITOR_TTL_S],
    );
  }

  await redis(commands);
  return send(res, 204);
}
