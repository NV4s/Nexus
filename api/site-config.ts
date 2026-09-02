import {
  configured,
  redis,
  requireAdmin,
  send,
  type Req,
  type Res,
} from './_lib.js';

const KEY = 'site:config';

/** Guards against an accidental paste turning into a page-wide banner. */
const MAX_BANNER = 280;
const MAX_HIDDEN = 400;

export type SiteConfig = {
  /** Shown across the top of every page. Empty means no banner. */
  banner: string;
  /** Slugs to withhold from the catalogue. */
  hidden: string[];
  /** Sections to withhold entirely. */
  hiddenSections: string[];
};

const EMPTY: SiteConfig = { banner: '', hidden: [], hiddenSections: [] };

function clean(input: unknown): SiteConfig {
  const value = (input ?? {}) as Partial<SiteConfig>;
  const list = (raw: unknown, cap: number) =>
    Array.isArray(raw)
      ? [...new Set(raw.filter((item): item is string => typeof item === 'string'))].slice(0, cap)
      : [];

  return {
    banner: typeof value.banner === 'string' ? value.banner.slice(0, MAX_BANNER) : '',
    hidden: list(value.hidden, MAX_HIDDEN),
    hiddenSections: list(value.hiddenSections, 10),
  };
}

/**
 * Reading is public and writing is not.
 *
 * Every visitor needs the banner and the hidden list on boot, so a GET cannot
 * require the admin cookie. Nothing sensitive is in here — it is a message and
 * two lists of slugs — but the write path still goes through `requireAdmin`,
 * which is the same session check the rest of the panel uses.
 */
export default async function handler(req: Req, res: Res) {
  if (!configured()) return send(res, 200, EMPTY);

  if (req.method === 'GET') {
    const [stored] = (await redis([['GET', KEY]])) ?? [];
    try {
      return send(res, 200, stored ? clean(JSON.parse(String(stored))) : EMPTY);
    } catch {
      // A corrupt value must not take the whole site down with it.
      return send(res, 200, EMPTY);
    }
  }

  if (req.method !== 'POST') return send(res, 405);
  if (!(await requireAdmin(req, res))) return;

  const next = clean(req.body);
  await redis([['SET', KEY, JSON.stringify(next)]]);
  return send(res, 200, next);
}
