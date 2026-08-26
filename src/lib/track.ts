/**
 * Anonymous presence beacon.
 *
 * Two ids, deliberately different lifetimes:
 *
 * - `vid` lives in localStorage and persists, so a returning browser is
 *   recognisable and "unique visitors" means something.
 * - `sid` lives in sessionStorage and dies with the tab, so "sessions" stays a
 *   separate, still-honest number rather than being replaced by the first.
 *
 * Both are random UUIDs. Nothing else is sent: no name, no account, no
 * user-agent, no fingerprint, and the server stores no IP. `vid` identifies a
 * browser on a device, not a person — a second browser is a second visitor, and
 * clearing site data makes a new one. The admin UI says exactly that.
 */

const BEAT_MS = 60_000;
const VISITOR_KEY = 'nexus:vid';

/** Persistent across visits. */
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

/** Dies with the tab. */
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

/** Route only, lowercased and stripped of anything the API would reject anyway. */
const currentPage = () =>
  (window.location.hash.slice(1) || '/').toLowerCase().replace(/[^a-z0-9/-]/g, '').slice(0, 64);

/**
 * Starts beating. Returns a stop function.
 *
 * Every call is fire-and-forget: a failed beat is swallowed, never retried, and
 * never awaited on a render path, so the site behaves identically when the
 * backend is missing or the whole thing is blocked by a school filter.
 */
export function startTracking() {
  const sid = sessionId();
  const vid = visitorId();
  if (!sid) return () => {}; // storage denied — do not track at all

  const started = Date.now();
  let first = true;
  let lastPage = '';

  const beat = () => {
    // Background tabs do not beat: on a school Chromebook most tabs are hidden,
    // and beating for all of them is what would burn the free tier.
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
    }).catch(() => {});
  };

  beat();
  const timer = window.setInterval(beat, BEAT_MS);
  // Beat on wake so someone returning to the tab reappears without a full interval,
  // and on navigation so the live view is not up to a minute out of date.
  document.addEventListener('visibilitychange', beat);
  window.addEventListener('hashchange', beat);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', beat);
    window.removeEventListener('hashchange', beat);
  };
}
