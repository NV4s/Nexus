import { configured, redis, requireAdmin, send, type Req, type Res } from '../_lib.js';

/** Tolerates one dropped beat at the client's 60s interval. */
const STALE_AFTER_MS = 90_000;
/** A client inventing session ids can only grow this hash; cap it. */
const MAX_PRESENCE = 500;

type Record = { p?: string; s?: number; t?: number };

export default async function handler(req: Req, res: Res) {
  // This doubles as the session check: the admin panel reads 401 as logged-out,
  // so there is no separate endpoint that could disagree with this one.
  if (!(await requireAdmin(req, res))) return;

  const today = new Date().toISOString().slice(0, 10);
  // Two cheap SCARDs rather than reading the visitor records: this runs on a 5s
  // poll, so per-visitor detail lives in /api/admin/visitors and is fetched only
  // when that panel is opened.
  const results = await redis([
    ['GET', 'visits:total'],
    ['HGETALL', 'visits:daily'],
    ['HGETALL', 'presence'],
    ['HLEN', 'presence'],
    ['SCARD', 'visitors:all'],
    ['SCARD', `visitors:daily:${today}`],
  ]);

  if (!results) {
    // Distinguishing these two matters: tracking degrades silently by design, so
    // a rejected credential otherwise looks identical to no traffic at all.
    return send(res, 200, {
      total: 0,
      daily: {},
      live: [],
      visitors: 0,
      visitorsToday: 0,
      offline: configured() ? 'rejected' : 'missing',
    });
  }

  const [total, dailyRaw, presenceRaw, size, visitors, visitorsToday] = results;

  // Upstash returns hashes as a flat [field, value, …] array.
  const pairs = (value: unknown): [string, string][] => {
    if (!Array.isArray(value)) return [];
    const out: [string, string][] = [];
    for (let i = 0; i < value.length; i += 2) out.push([String(value[i]), String(value[i + 1])]);
    return out;
  };

  const daily = Object.fromEntries(pairs(dailyRaw).map(([day, count]) => [day, Number(count)]));

  const now = Date.now();
  const live: { page: string; seconds: number }[] = [];
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
    // The session id is never returned — the admin has no use for it, so it stays here.
    live.push({ page: record.p ?? '?', seconds: Math.max(0, Math.round((now - (record.s ?? now)) / 1000)) });
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
  });
}
