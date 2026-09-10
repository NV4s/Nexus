import { redis, requireAdmin, send, type Req, type Res } from '../_lib.js';


const PAGE_SIZE = 25;

export type VisitorRow = {
  id: string;
  first: number;
  last: number;
  visits: number;
  games: string[];

  place?: string;
};


export default async function handler(req: Req, res: Res) {
  if (!(await requireAdmin(req, res))) return;


  const recent = await redis([['ZREVRANGE', 'visitors:recent', 0, PAGE_SIZE - 1]]);
  const ids = Array.isArray(recent?.[0]) ? (recent[0] as string[]) : [];
  if (!ids.length) return send(res, 200, { visitors: [] });

  const details = await redis(
    ids.flatMap((id) => [
      ['HGETALL', `visitor:${id}`],
      ['SMEMBERS', `visitor:${id}:games`],
    ]),
  );

  const pairs = (value: unknown): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!Array.isArray(value)) return out;
    for (let i = 0; i < value.length; i += 2) out[String(value[i])] = String(value[i + 1]);
    return out;
  };

  const visitors: VisitorRow[] = ids.map((id, index) => {
    const record = pairs(details?.[index * 2]);
    const games = details?.[index * 2 + 1];
    return {

      id: id.slice(0, 8),
      first: Number(record.first ?? 0),
      last: Number(record.last ?? 0),
      visits: Number(record.visits ?? 0),
      games: Array.isArray(games) ? (games as string[]).slice(0, 12) : [],
      ...(record.place ? { place: record.place } : {}),
    };
  });

  return send(res, 200, { visitors });
}
