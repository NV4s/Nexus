import { configured, redis, requireAdmin, send, type Req, type Res } from '../_lib.js';


const STALE_AFTER_MS = 90_000;

const MAX_PRESENCE = 500;

type Record = { p?: string; s?: number; t?: number; v?: string };

export default async function handler(req: Req, res: Res) {


  if (!(await requireAdmin(req, res))) return;

  const today = new Date().toISOString().slice(0, 10);



  const results = await redis([
    ['GET', 'visits:total'],
    ['HGETALL', 'visits:daily'],
    ['HGETALL', 'presence'],
    ['HLEN', 'presence'],
    ['SCARD', 'visitors:all'],
    ['SCARD', `visitors:daily:${today}`],
    ['HGETALL', 'visits:places'],
  ]);

  if (!results) {


    return send(res, 200, {
      total: 0,
      daily: {},
      live: [],
      visitors: 0,
      visitorsToday: 0,
      places: {},
      offline: configured() ? 'rejected' : 'missing',
    });
  }

  const [total, dailyRaw, presenceRaw, size, visitors, visitorsToday, placesRaw] = results;


  const pairs = (value: unknown): [string, string][] => {
    if (!Array.isArray(value)) return [];
    const out: [string, string][] = [];
    for (let i = 0; i < value.length; i += 2) out.push([String(value[i]), String(value[i + 1])]);
    return out;
  };

  const daily = Object.fromEntries(pairs(dailyRaw).map(([day, count]) => [day, Number(count)]));
  const places = Object.fromEntries(pairs(placesRaw).map(([place, count]) => [place, Number(count)]));

  const now = Date.now();
  const live: { page: string; seconds: number; sid: string; vid?: string }[] = [];
  const stale: string[] = [];

  for (const [sid, json] of pairs(presenceRaw)) {
    let record: Record;
    try {
      record = JSON.parse(json) as Record;
    } catch {
      stale.push(sid);
      continue;
    }
    if (!record.t || now - record.t > STALE_AFTER_MS) {
      stale.push(sid);
      continue;
    }


    live.push({
      page: record.p ?? '?',
      seconds: Math.max(0, Math.round((now - (record.s ?? now)) / 1000)),
      sid,
      ...(record.v ? { vid: record.v } : {}),
    });
  }

  if (Number(size ?? 0) > MAX_PRESENCE) await redis([['DEL', 'presence']]);
  else if (stale.length) await redis([['HDEL', 'presence', ...stale]]);

  live.sort((a, b) => b.seconds - a.seconds);
  return send(res, 200, {
    total: Number(total ?? 0),
    daily,
    live,
    visitors: Number(visitors ?? 0),
    visitorsToday: Number(visitorsToday ?? 0),
    places,
  });
}
