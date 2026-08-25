/**
 * Anonymous presence beacon.
 *
 * The id lives in sessionStorage, so the browser destroys it when the tab closes.
 * That makes cross-session identity impossible by construction rather than by a
 * rotation timer someone has to remember to get right — and it means the counter
 * measures sessions, not people. Nothing else is sent: no name, no fingerprint,
 * and the server stores no IP.
 */

const BEAT_MS = 60_000;

const sessionId = () => {
  try {
    const existing = sessionStorage.getItem('sid');
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem('sid', fresh);
    return fresh;
  } catch {
    return null; // private mode with storage denied — simply do not track
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
  if (!sid) return () => {};

  const started = Date.now();
  let first = true;

  const beat = () => {
    // Background tabs do not beat: on a school Chromebook most tabs are hidden,
    // and beating for all of them is what would burn the free tier.
    if (document.visibilityState !== 'visible') return;

    const payload = JSON.stringify({ sid, page: currentPage(), started, first });
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
  // Beat on wake so someone returning to the tab reappears without a full interval.
  document.addEventListener('visibilitychange', beat);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', beat);
  };
}
