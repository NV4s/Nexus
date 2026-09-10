import { redis, send, type Req, type Res } from './_lib.js';


const UUID = /^[0-9a-f-]{36}$/;
const PAGE = /^[a-z0-9/-]{0,64}$/;

const PRESENCE_TTL_S = 900;
const DAILY_TTL_S = 35 * 24 * 60 * 60;
const VISITOR_TTL_S = 90 * 24 * 60 * 60;

const RECENT_KEEP = 200;
const DAY_MS = 86_400_000;

const TROLL_TTL_MS = 10 * 60 * 1000;


const PLACE = /^[A-Za-z0-9 .'-]{1,40}$/;

function placeOf(req: Req): string | null {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const pick = (name: string) => {
    const value = headers[name];
    if (typeof value !== 'string') return null;



    let decoded = value;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      return null;
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


  if (req.method !== 'POST') return send(res, 204);

  const body = (req.body ?? {}) as Record<string, unknown>;

  const sid = typeof body.sid === 'string' && UUID.test(body.sid) ? body.sid : null;
  if (!sid) return send(res, 204);
  const vid = typeof body.vid === 'string' && UUID.test(body.vid) ? body.vid : null;

  const page = typeof body.page === 'string' && PAGE.test(body.page) ? body.page : '?';
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);





  const claimed = typeof body.started === 'number' ? body.started : now;
  const started = claimed > now || now - claimed > DAY_MS ? now : claimed;



  const commands: (string | number)[][] = [
    ['HMGET', 'mod', `b:${vid ?? '-'}`, `t:${sid}`],
    ['HSET', 'presence', sid, JSON.stringify({ p: page, s: started, t: now, v: vid ?? undefined })],
  ];

  if (body.first === true) {

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


  const slug = body.changed === true && vid ? slugOf(page) : null;
  if (slug && vid) {
    commands.push(
      ['SADD', `visitor:${vid}:games`, slug],
      ['EXPIRE', `visitor:${vid}:games`, VISITOR_TTL_S],
    );
  }

  const results = await redis(commands);

  const [blocked, trollRaw] = Array.isArray(results?.[0])
    ? (results[0] as (string | null)[])
    : [null, null];

  if (blocked) return send(res, 200, { blocked: true });

  if (trollRaw) {


    await redis([['HDEL', 'mod', `t:${sid}`]]);
    try {
      const troll = JSON.parse(String(trollRaw)) as { kind: string; text: string; at: number };
      if (now - troll.at < TROLL_TTL_MS) return send(res, 200, { troll });
    } catch {}
  }

  return send(res, 204);
}
