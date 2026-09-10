








import { createServer } from 'node:http';

const str = new Map(), hash = new Map(), set = new Map(), zset = new Map(), list = new Map();
const l = (k) => list.get(k) ?? (list.set(k, []), list.get(k));
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
    case 'HMGET': { const m = h(a[0]); return a.slice(1).map((f) => m.get(String(f)) ?? null); }
    case 'LPUSH': { const c = l(a[0]); c.unshift(...a.slice(1).map(String)); return c.length; }
    case 'LRANGE': { const c = l(a[0]); const stop = Number(a[2]); return c.slice(Number(a[1]), stop < 0 ? undefined : stop + 1); }
    case 'LTRIM': { const c = l(a[0]); const stop = Number(a[2]); list.set(a[0], c.slice(Number(a[1]), stop < 0 ? undefined : stop + 1)); return 'OK'; }
    case 'LREM': { const c = l(a[0]); const i = c.indexOf(String(a[2])); if (i >= 0) c.splice(i, 1); return i >= 0 ? 1 : 0; }
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
    case 'DEL': { str.delete(a[0]); hash.delete(a[0]); set.delete(a[0]); zset.delete(a[0]); list.delete(a[0]); return 1; }
    default: throw new Error('stub: unsupported ' + cmd);
  }
};

export const server = createServer((req, res) => {
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
});

export const reset = () => {
  for (const store of [str, hash, set, zset, list]) store.clear();
};


if (process.argv[1] && process.argv[1].endsWith('redis-stub.mjs')) {
  server.listen(6390, () => console.log('stub listening on 6390'));
}
