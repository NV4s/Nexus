import {
  clientIp,
  ipKey,
  issueToken,
  redis,
  secretEquals,
  send,
  sessionCookie,
  type Req,
  type Res,
} from '../_lib';

const WINDOW_S = 900;
const PER_IP_LIMIT = 10;
const GLOBAL_LIMIT = 100;

/** Every reply waits the same beat, so timing never tells an attacker anything. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 250));

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return send(res, 405);

  const password = (req.body as { password?: unknown } | undefined)?.password;
  if (typeof password !== 'string') {
    await settle();
    return send(res, 401, { error: 'invalid' });
  }

  const bucket = `rl:login:${await ipKey(clientIp(req))}`;
  const counts = await redis([
    ['GET', bucket],
    ['GET', 'rl:login:global'],
  ]);

  const attempts = Number(counts?.[0] ?? 0);
  const globalAttempts = Number(counts?.[1] ?? 0);
  if (attempts >= PER_IP_LIMIT || globalAttempts >= GLOBAL_LIMIT) {
    await settle();
    res.setHeader('retry-after', String(WINDOW_S));
    return send(res, 429, { error: 'too many attempts' });
  }

  if (!(await secretEquals(password, process.env.ADMIN_PASSWORD ?? ''))) {
    // Counted only on failure, so ordinary logins cost no quota.
    await redis([
      ['INCR', bucket],
      ['EXPIRE', bucket, WINDOW_S],
      ['INCR', 'rl:login:global'],
      ['EXPIRE', 'rl:login:global', WINDOW_S],
    ]);
    await settle();
    return send(res, 401, { error: 'invalid' });
  }

  await settle();
  res.setHeader('set-cookie', sessionCookie(await issueToken()));
  return send(res, 204);
}
