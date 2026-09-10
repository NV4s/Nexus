

import type { Directive } from './mod.ts';

const BEAT_MS = 60_000;
const VISITOR_KEY = 'nexus:vid';

export const ids = () => ({ sid: sessionId(), vid: visitorId() });


const visitorId = () => {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
};


const sessionId = () => {
  try {
    const existing = sessionStorage.getItem('sid');
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem('sid', fresh);
    return fresh;
  } catch {
    return null;
  }
};


const currentPage = () =>
  (window.location.hash.slice(1) || '/').toLowerCase().replace(/[^a-z0-9/-]/g, '').slice(0, 64);


export function startTracking() {
  const sid = sessionId();
  const vid = visitorId();
  if (!sid) return () => {};

  const started = Date.now();
  let first = true;
  let lastPage = '';

  const beat = () => {


    if (document.visibilityState !== 'visible') return;

    const page = currentPage();
    const changed = page !== lastPage;
    lastPage = page;

    const payload = JSON.stringify({ sid, vid, page, started, first, changed });
    first = false;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    })
      .then(async (response) => {


        if (response.status !== 200) return;
        const directive = (await response.json()) as Directive;
        const { applyDirective } = await import('./mod.ts');
        applyDirective(directive);
      })
      .catch(() => {});
  };

  beat();
  const timer = window.setInterval(beat, BEAT_MS);


  document.addEventListener('visibilitychange', beat);
  window.addEventListener('hashchange', beat);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', beat);
    window.removeEventListener('hashchange', beat);
  };
}
