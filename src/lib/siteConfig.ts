export type SiteConfig = {
  banner: string;
  hidden: string[];
  hiddenSections: string[];
};

const EMPTY: SiteConfig = { banner: '', hidden: [], hiddenSections: [] };

/**
 * Settings the owner can change without a redeploy.
 *
 * Cached in localStorage and served from there on the next boot, so a slow or
 * unreachable API costs nothing visible — the site renders with whatever it
 * last knew and quietly corrects itself when the fetch lands.
 */
const CACHE = 'nexus:siteConfig';

let current: SiteConfig = read();

function read(): SiteConfig {
  try {
    const raw = localStorage.getItem(CACHE);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<SiteConfig>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export const siteConfig = () => current;

const listeners = new Set<(config: SiteConfig) => void>();

export function onSiteConfig(listener: (config: SiteConfig) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await fetch('/api/site-config');
    if (!response.ok) return current;
    const next = { ...EMPTY, ...((await response.json()) as Partial<SiteConfig>) };
    current = next;
    try {
      localStorage.setItem(CACHE, JSON.stringify(next));
    } catch {
      /* the fetch still applies for this visit */
    }
    for (const listener of listeners) listener(next);
  } catch {
    /* offline or no Redis configured — the cached copy stands */
  }
  return current;
}

export async function saveSiteConfig(next: SiteConfig): Promise<SiteConfig> {
  const response = await fetch('/api/site-config', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(next),
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'Signed out' : 'Could not save');
  current = (await response.json()) as SiteConfig;
  for (const listener of listeners) listener(current);
  return current;
}
