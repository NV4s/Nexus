import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Minimal request/response shapes. Vercel's Node runtime parses a JSON body onto
 * `body` for us; typing it here avoids pulling in @vercel/node just for types.
 */
export type Req = IncomingMessage & { body?: unknown; method?: string };
export type Res = ServerResponse;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const configured = () => Boolean(REDIS_URL && REDIS_TOKEN);

/**
 * Runs commands through Upstash's REST pipeline — one round trip for the whole
 * batch. Upstash bills per command, so batching saves latency, not quota.
 *
 * Returns null on any failure: tracking is best-effort and must never surface
 * as an error to a player who only wants to load a game.
 */
export async function redis(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!configured()) return null;
  try {
    const response = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: { authorization: `Bearer ${REDIS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!response.ok) return null;
    const results = (await response.json()) as { result?: unknown; error?: string }[];
    return results.map((entry) => entry.result ?? null);
  } catch {
    return null;
  }
}

/* ---------- crypto ---------- */

const encoder = new TextEncoder();

async function hmac(message: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Buffer.from(signature).toString('base64url');
}

/**
 * Compares by digest rather than by string. Web Crypto has no timingSafeEqual,
 * and an attacker cannot steer a digest without the key, so comparing the two
 * HMACs leaks neither the password nor its length.
 */
export async function secretEquals(submitted: string, expected: string) {
  if (!expected) return false;
  return (await hmac(submitted)) === (await hmac(expected));
}

const TWELVE_HOURS = 12 * 60 * 60;

/** Token is `<expiry>.<signature>` — one claim, so no JWT library is needed. */
export async function issueToken() {
  const expires = Math.floor(Date.now() / 1000) + TWELVE_HOURS;
  return `${expires}.${await hmac(String(expires))}`;
}

export async function tokenValid(token: string | undefined) {
  if (!token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature) return false;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  return (await hmac(expires)) === signature;
}

/** Rate-limit buckets are keyed by a digest, so no raw IP is ever stored. */
export const ipKey = async (ip: string) => (await hmac(`ip:${ip}`)).slice(0, 16);

/* ---------- http ---------- */

export const COOKIE = 'nx_admin';

export const sessionCookie = (token: string) =>
  `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${TWELVE_HOURS}`;

export const clearedCookie = () =>
  `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0`;

export function readCookie(req: Req, name: string) {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

export const clientIp = (req: Req) =>
  (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? 'unknown';

export function send(res: Res, status: number, body?: unknown) {
  res.statusCode = status;
  if (body === undefined) return res.end();
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Authenticates an admin request, replying 401 itself when it fails. */
export async function requireAdmin(req: Req, res: Res) {
  if (await tokenValid(readCookie(req, COOKIE))) return true;
  send(res, 401);
  return false;
}
