export type SiteConfig = {
  banner: string;
  hidden: string[];
  hiddenSections: string[];
};

const EMPTY: SiteConfig = { banner: '', hidden: [], hiddenSections: [] };


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
    } catch {}
    for (const listener of listeners) listener(next);
  } catch {}
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
