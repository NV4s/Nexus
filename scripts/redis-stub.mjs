// Minimal in-memory stand-in for the Upstash REST pipeline endpoint, so the API
// can be exercised without real credentials — and so a rotated token never
// invalidates the tests.
//
//   node scripts/redis-stub.mjs
//   UPSTASH_REDIS_REST_URL=http://127.0.0.1:6390 UPSTASH_REDIS_REST_TOKEN=stub vercel dev
//
// Not a Redis: no persistence, no TTLs (EXPIRE returns 1 and forgets), and
// ZREMRANGEBYRANK is a no-op. It implements exactly the commands api/ sends.
import { createServer } from 'node:http';

const str = new Map(), hash = new Map(), set = new Map(), zset = new Map();
const h = (k) => hash.get(k) ?? (hash.set(k, new Map()), hash.get(k));
const s = (k) => set.get(k) ?? (set.set(k, new Set()), set.get(k));
const z = (k) => zset.get(k) ?? (zset.set(k, new Map()), zset.get(k));

const run = ([cmd, ...a]) => {
  switch (String(cmd).toUpperCase()) {
    case 'GET': return str.get(a[0]) ?? null;
    case 'INCR': { const v = Number(str.get(a[0]) ?? 0) + 1; str.set(a[0], String(v)); return v; }
    case 'HSET': { h(a[0]).set(String(a[1]), String(a[2])); return 1; }
    case 'HSETNX': { const m = h(a[0]); if (m.has(String(a[1]))) return 0; m.set(String(a[1]), String(a[2])); return 1; }
    case 'HINCRBY': { const m = h(a[0]); const v = Number(m.get(String(a[1])) ?? 0) + Number(a[2]); m.set(String(a[1]), String(v)); return v; }
    case 'HGETALL': return [...h(a[0])].flat();
    case 'HLEN': return h(a[0]).size;
    case 'HDEL': { const m = h(a[0]); let n = 0; for (const f of a.slice(1)) if (m.delete(String(f))) n++; return n; }
    case 'SADD': { const c = s(a[0]); const before = c.size; a.slice(1).forEach((v) => c.add(String(v))); return c.size - before; }
    case 'SCARD': return s(a[0]).size;
    case 'SMEMBERS': return [...s(a[0])];
    case 'ZADD': { z(a[0]).set(String(a[2]), Number(a[1])); return 1; }
    case 'ZREVRANGE': {
      const all = [...z(a[0])].sort((x, y) => y[1] - x[1]).map(([m]) => m);
      const stop = Number(a[2]);
      return all.slice(Number(a[1]), stop < 0 ? undefined : stop + 1);
    }
    case 'ZREMRANGEBYRANK': return 0;
    case 'EXPIRE': return 1;
    case 'DEL': { str.delete(a[0]); hash.delete(a[0]); set.delete(a[0]); zset.delete(a[0]); return 1; }
    default: throw new Error('stub: unsupported ' + cmd);
  }
};

createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      const out = JSON.parse(body).map((c) => ({ result: run(c) }));
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(500).end(JSON.stringify({ error: e.message }));
    }
  });
}).listen(6390, () => console.log('stub listening on 6390'));
